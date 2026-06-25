import React, { useState, useEffect } from 'react';
import axios from 'axios';
import qs from 'qs';
import './App.css';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import { v4 as uuidv4 } from 'uuid';

import 'bootstrap/dist/css/bootstrap.min.css';

const CLIENT_ID = '11850868287-bk9segtppsphi3e41i51inkhvfvc2fro.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function App() {
  const [loginStatus, setLoginStatus] = useState(null);

  const handleLogin = () => {
    const nonce = uuidv4();
    localStorage.setItem('oauth2_nonce', nonce);
    window.location.href = `${AUTH_URL}&nonce=${nonce}`;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const receivedNonce = urlParams.get('nonce');
    const storedNonce = localStorage.getItem('oauth2_nonce');

    if (code && receivedNonce !== storedNonce) {
      const requestAccess = async () => {
        try {
          if (!CLIENT_SECRET) {
            setLoginStatus('Missing Google client secret. Move token exchange to server side.');
            return;
          }
          const response = await axios.post(
            TOKEN_URL,
            qs.stringify({
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              code: code,
              redirect_uri: REDIRECT_URI,
              grant_type: 'authorization_code',
              scope: 'profile',
              access_type: 'offline',
              prompt: 'consent',
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );

          window.history.pushState({}, null, "/");
          const accessToken = response.data.access_token;
          const profileData = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          setLoginStatus(`Welcome, ${profileData.data.name}!`);
        } catch (error) {
          if (error.response) {
            console.log('Response data:', error.response.data);
          }
          console.log('Error:', error.message);
          setLoginStatus('An error occurred during login');
        }
      };
      requestAccess();
    }
  }, []);

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="text-center">
        <h1>Testing Authentication with OAuth2 using Auth Code and Nonce</h1>
        <p className="lead">Sign in to access your account</p>
        {loginStatus !== null ? (
          <div>
            <p className="text-success">{loginStatus}</p>
            <Button variant="primary" onClick={() => setLoginStatus(null)}>
              Logout
            </Button>
          </div>
        ) : (
          <Button variant="primary" onClick={handleLogin}>
            <Image src="https://seeklogo.com/images/G/google-2015-logo-65BBD07B01-seeklogo.com.png" alt="Google Logo" className="google-logo" /> Login with Google
          </Button>
        )}
      </div>
    </div>
  );
}

export default App;
