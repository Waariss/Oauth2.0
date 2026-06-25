import React, { useEffect, useState } from 'react';
import './App.css';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import 'bootstrap/dist/css/bootstrap.min.css';

const DEFAULT_CLIENT_ID = '11850868287-bk9segtppsphi3e41i51inkhvfvc2fro.apps.googleusercontent.com';
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
const IS_LOCAL = window.location.hostname === 'localhost';

const REDIRECT_URI = IS_LOCAL
  ? 'http://localhost:3000/callback'
  : 'https://oauth-test-web.netlify.app/callback';

function toBase64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  window.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return toBase64Url(digest);
}

function createAuthUrl({ useStateParam, state, nonce, codeChallenge }) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    nonce
  });

  if (useStateParam) {
    params.set('state', state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function App() {
  const [loginStatus, setLoginStatus] = useState(null);
  const [useStateParam, setUseStateParam] = useState(true);
  const [diagnostic, setDiagnostic] = useState({
    verdict: 'waiting',
    message: 'Ready to start OAuth flow.'
  });
  const [flowDetails, setFlowDetails] = useState(null);

  const handleLogin = async () => {
    const codeVerifier = randomToken(64);
    const codeChallenge = await createCodeChallenge(codeVerifier);
    const nonce = randomToken(24);
    const state = randomToken(24);

    sessionStorage.setItem('oauth2_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth2_nonce', nonce);
    sessionStorage.setItem('oauth2_flow_mode', useStateParam ? 'with_state' : 'without_state');

    if (useStateParam) {
      sessionStorage.setItem('oauth2_state', state);
      setDiagnostic({
        verdict: 'secure-mode',
        message: 'Starting flow with state validation enabled.'
      });
    } else {
      sessionStorage.removeItem('oauth2_state');
      setDiagnostic({
        verdict: 'demo-risk-mode',
        message: 'Starting flow without state. This mode demonstrates CSRF exposure.'
      });
    }

    window.location.href = createAuthUrl({
      useStateParam,
      state,
      nonce,
      codeChallenge
    });
  };

  const handleLogout = () => {
    setLoginStatus(null);
    setFlowDetails(null);
    setDiagnostic({
      verdict: 'waiting',
      message: 'Ready to start OAuth flow.'
    });
    sessionStorage.removeItem('oauth2_state');
    sessionStorage.removeItem('oauth2_code_verifier');
    sessionStorage.removeItem('oauth2_nonce');
    sessionStorage.removeItem('oauth2_flow_mode');
    window.history.replaceState({}, document.title, '/');
  };

  async function exchangeCodeForToken({ code, codeVerifier }) {
    const response = await fetch('/.netlify/functions/oauth-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        redirectUri: REDIRECT_URI,
        codeVerifier
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Token exchange failed');
    }

    return payload;
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const receivedState = urlParams.get('state');
    const oauthError = urlParams.get('error');
    const oauthErrorDescription = urlParams.get('error_description');
    const storedState = sessionStorage.getItem('oauth2_state');
    const codeVerifier = sessionStorage.getItem('oauth2_code_verifier');
    const flowMode = sessionStorage.getItem('oauth2_flow_mode') || 'with_state';
    const expectsState = flowMode === 'with_state';

    if (!code && !oauthError) {
      return;
    }

    if (oauthError) {
      setDiagnostic({
        verdict: 'error',
        message: `${oauthError}${oauthErrorDescription ? `: ${oauthErrorDescription}` : ''}`
      });
      return;
    }

    const stateMatches = !expectsState || (receivedState && storedState && receivedState === storedState);
    const callbackAssessment = {
      hasCode: Boolean(code),
      receivedState: receivedState || null,
      storedState: storedState || null,
      stateMatches,
      flowMode
    };
    setFlowDetails(callbackAssessment);

    if (!code) {
      setDiagnostic({
        verdict: 'high-risk',
        message: 'Callback missing authorization code.'
      });
      return;
    }

    if (expectsState && !stateMatches) {
      setDiagnostic({
        verdict: 'state-mismatch',
        message: 'State validation failed. Login aborted to prevent CSRF.'
      });
      return;
    }

    if (!codeVerifier) {
      setDiagnostic({
        verdict: 'error',
        message: 'Missing PKCE verifier. Start login again.'
      });
      return;
    }

    const requestAccess = async () => {
      try {
        const tokenPayload = await exchangeCodeForToken({ code, codeVerifier });
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenPayload.access_token}`
          }
        });

        if (!profileResponse.ok) {
          throw new Error('Unable to fetch profile from Google');
        }

        const profileData = await profileResponse.json();
        setLoginStatus(`Welcome, ${profileData.name}!`);
        setDiagnostic({
          verdict: expectsState ? 'basic-protected' : 'potential-csrf',
          message: expectsState
            ? 'State validated and token exchange succeeded.'
            : 'Login succeeded without state. Keep this mode for testing only.'
        });
        window.history.pushState({}, null, '/');
      } catch (error) {
        setLoginStatus('An error occurred during login');
        setDiagnostic({
          verdict: 'error',
          message: error.message
        });
      }
    };

    requestAccess();
  }, []);

  return (
    <div className="page-shell">
      <div className="app-card">
        <h1>OAuth 2.0 Security Test Portal</h1>
        <p className="lead">Run login flows, validate state handling, and inspect CSRF exposure.</p>
        <p className="text-muted">
          Extension guide:{' '}
          <a
            href="https://github.com/Waariss/Oauth2.0/blob/main/extension/HOW_TO_USE.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            OAuth 2.0 Flow Inspector
          </a>
        </p>

        <div className="mode-bar">
          <Button
            variant={useStateParam ? 'success' : 'outline-secondary'}
            onClick={() => setUseStateParam(true)}
          >
            State Enabled (Recommended)
          </Button>
          <Button
            variant={!useStateParam ? 'warning' : 'outline-secondary'}
            onClick={() => setUseStateParam(false)}
          >
            Auth Code Only (Risk Demo)
          </Button>
        </div>

        <div className="diagnostic-panel">
          <strong>Verdict:</strong> {diagnostic.verdict}
          <div>{diagnostic.message}</div>
        </div>

        {flowDetails && (
          <div className="flow-details">
            <div><strong>Flow mode:</strong> {flowDetails.flowMode}</div>
            <div><strong>Code in callback:</strong> {flowDetails.hasCode ? 'yes' : 'no'}</div>
            <div><strong>State received:</strong> {flowDetails.receivedState || 'none'}</div>
            <div><strong>Stored state:</strong> {flowDetails.storedState || 'none'}</div>
            <div><strong>State validation:</strong> {flowDetails.stateMatches ? 'passed' : 'failed'}</div>
          </div>
        )}

        {loginStatus !== null ? (
          <div className="action-row">
            <p className="text-success">{loginStatus}</p>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <Button variant="primary" className="mt-3" onClick={handleLogin}>
            <Image
              src="https://seeklogo.com/images/G/google-2015-logo-65BBD07B01-seeklogo.com.png"
              alt="Google Logo"
              className="google-logo"
            />{' '}
            Login with Google
          </Button>
        )}
      </div>
    </div>
  );
}

export default App;
