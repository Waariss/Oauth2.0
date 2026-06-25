# Authentication Web State (Upgraded)

This app is an OAuth 2.0 security test portal for Google login flows.

## What changed

- Added **PKCE** (`code_verifier` + `code_challenge`) to reduce authorization-code interception risk.
- Removed Google client secret from frontend code.
- Added a **Netlify Function** (`netlify/functions/oauth-token.js`) to exchange authorization code securely on the server side.
- Added callback diagnostics (state match/mismatch, code presence, flow mode).
- Kept insecure mode ("Auth Code only") only for CSRF risk demonstration.

## Environment variables (Netlify)

Set these in Netlify Site Settings -> Environment variables:

- `GOOGLE_CLIENT_ID` (optional if using the default configured value)
- `GOOGLE_CLIENT_SECRET` (required)

For frontend override (optional):

- `REACT_APP_GOOGLE_CLIENT_ID`

## Local development

```bash
npm install
npm start
```

For function testing in local dev, use Netlify CLI (`netlify dev`) so `/.netlify/functions/*` routes are available.

## Build

```bash
npm run build
```
