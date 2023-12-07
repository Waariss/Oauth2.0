import React, { useState, useEffect } from 'react';
import axios from 'axios';
import qs from 'qs';
import './App.css';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import { v4 as uuidv4 } from 'uuid';
import 'bootstrap/dist/css/bootstrap.min.css';

const CLIENT_ID = 'REDACTED_GOOGLE_CLIENT_ID';
const CLIENT_SECRET = 'REDACTED_GOOGLE_CLIENT_SECRET'; 
const IS_LOCAL = window.location.hostname === "localhost";

const REDIRECT_URI = IS_LOCAL 
    ? 'http://localhost:3000/callback'
    : 'https://oauth-test-web.netlify.app/callback';
const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function App() {
  const [loginStatus, setLoginStatus] = useState(null);
  const [useStateParam, setUseStateParam] = useState(true);

  const handleLogin = () => {
    let state;
    if (useStateParam) {
      state = uuidv4();
      localStorage.setItem('oauth2_state', state);
    } else {
      state = null;
    }
    window.location.href = `${AUTH_URL}${state ? `&state=${state}` : ''}`;
  };

  const handleLogout = () => {
    setLoginStatus(null);
    localStorage.removeItem('oauth2_state'); // Clear the stored state
    window.history.replaceState({}, document.title, "/"); // Clear URL parameters
};

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const receivedState = urlParams.get('state');
    const storedState = localStorage.getItem('oauth2_state');

    if ((useStateParam && code && receivedState === storedState) || (useStateParam && code)) {
      const requestAccess = async () => {
        try {
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
          <h1>Testing Authentication with OAuth2</h1>
          <p className="lead">Sign in to access your account</p>
          <p className="text-muted">Google Chrome and Firefox Support Only</p>
          <p className="text-muted">
              For optimal functionality, 
              <a href="https://github.com/Waariss/Detecting-Vulnerable-OAuth-2.0-Implementations-in-Android-Applications/blob/main/Web_App/extension/How-to-use.md" target="_blank" rel="noopener noreferrer"> follow these instructions</a>.
          </p>
          <div className="mt-4 mb-3">
              {/* Toggle button */}
              <Button variant="outline-secondary" onClick={() => setUseStateParam(!useStateParam)}>
                  {useStateParam ? 'Switch to Auth Code only' : 'Switch to Auth Code with State'}
              </Button>
          </div>
          {loginStatus !== null ? (
              <div className="mt-3">
                  <p className="text-success">{loginStatus}</p>
                  <Button variant="danger" onClick={handleLogout}>
                      Logout
                  </Button>
              </div>
          ) : (
              <Button variant="primary" className="mt-3" onClick={handleLogin}>
                  <Image src="https://seeklogo.com/images/G/google-2015-logo-65BBD07B01-seeklogo.com.png" alt="Google Logo" className="google-logo" /> Login with Google
              </Button>
          )}
      </div>
    </div>
  );
}

export default App;
