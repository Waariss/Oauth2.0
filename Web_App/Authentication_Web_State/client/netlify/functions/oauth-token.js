exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { code, redirectUri, codeVerifier } = JSON.parse(event.body || '{}');

    if (!code || !redirectUri || !codeVerifier) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: code, redirectUri, codeVerifier'
        })
      };
    }

    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      '11850868287-bk9segtppsphi3e41i51inkhvfvc2fro.apps.googleusercontent.com';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Server is not configured. Missing GOOGLE_CLIENT_SECRET.'
        })
      };
    }

    const payload = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });

    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return {
        statusCode: tokenResponse.status,
        body: JSON.stringify({
          error: tokenPayload.error_description || tokenPayload.error || 'Token exchange failed',
          raw: tokenPayload
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(tokenPayload)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Unexpected server error'
      })
    };
  }
};
