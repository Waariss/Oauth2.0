import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import queryString from 'query-string';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  redirectUrl: process.env.REDIRECT_URL,
  clientUrl: process.env.CLIENT_URL,
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000,
  postUrl: 'https://jsonplaceholder.typicode.com/posts'
};

const authParams = queryString.stringify({
  client_id: config.clientId,
  redirect_uri: config.redirectUrl,
  response_type: 'code',
  scope: 'openid profile email https://www.googleapis.com/auth/gmail.readonly',
  access_type: 'offline',
  prompt: 'consent',
});

const getTokenParams = (code) => queryString.stringify({
  client_id: config.clientId,
  client_secret: config.clientSecret,
  code,
  grant_type: 'authorization_code',
  redirect_uri: config.redirectUrl,
});

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
const auth = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, config.tokenSecret);
    req.user = decoded.user; // add this line
    return next();
  } catch (err) {
    console.error('Error: ', err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

app.get('/user/messages', auth, async (req, res) => {
  try {
    const accessToken = req.user.accessToken;
    const response = await axios.get('https://www.googleapis.com/gmail/v1/users/me/messages', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const messageIds = response.data.messages.map(message => message.id);
    const messages = await Promise.all(messageIds.map(async messageId => {
      const { data } = await axios.get(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return data.snippet;
    }));
    res.json({ messages });
  } catch (err) {
    console.error('Error: ', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

app.get('/auth/url', (_, res) => {
  res.json({
    url: `${config.authUrl}?${authParams}`,
  });
});

app.get('/auth/token', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'Authorization code must be provided' });
  try {
    const tokenParam = getTokenParams(code);
    const { data: { id_token, access_token } } = await axios.post(`${config.tokenUrl}?${tokenParam}`);
    if (!id_token) return res.status(400).json({ message: 'Auth error' });
    const { email, name, picture } = jwt.decode(id_token);
    const user = { name, email, picture, accessToken: access_token }; // add the access token here
    const token = jwt.sign({ user }, config.tokenSecret, { expiresIn: config.tokenExpiration });
    res.cookie('token', token, { maxAge: config.tokenExpiration, httpOnly: true, });
    console.log('User:', user);
    res.json({
      user,
    });
  } catch (err) {
    console.error('Error: ', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

app.get('/auth/logged_in', (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.json({ loggedIn: false });
    const { user } = jwt.verify(token, config.tokenSecret);
    const newToken = jwt.sign({ user }, config.tokenSecret, { expiresIn: config.tokenExpiration });
    res.cookie('token', newToken, { maxAge: config.tokenExpiration, httpOnly: true });
    res.json({ loggedIn: true, user });
  } catch (err) {
    res.json({ loggedIn: false });
  }
});

app.post("/auth/logout", (_, res) => {
  res.clearCookie('token').json({ message: 'Logged out' });
});

app.get('/user/posts', auth, async (_, res) => {
  try {
    const { data } = await axios.get(config.postUrl);
    res.json({ posts: data?.slice(0, 5) });
  } catch (err) {
    console.error('Error: ', err);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 OAuth 2.0 Server listening on port ${PORT} Only Auth Code`));
