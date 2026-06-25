# OAuth 2.0 Flow Inspector Extension

This extension helps you inspect OAuth 2.0 authorization requests and callbacks while giving a quick CSRF-risk verdict based on `state` and `code` validation.

## Installation Steps

### 1. Download the Extension
Download the `extension` folder from this repository:
<https://github.com/Waariss/Oauth2.0/tree/main/extension>

### 2. Installing on Google Chrome

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable `Developer mode` by toggling the switch in the top right corner.
4. Click on the `Load unpacked` button.
5. Select the local `extension` directory.
6. The extension should now appear in your list of Chrome extensions.

## Usage

1. Start an OAuth login flow in the target web application.
2. After redirects complete, click the extension icon.
3. Review the analysis shown in the popup:
   - Verdict (`basic-protected`, `potential-csrf`, `state-mismatch`, `high-risk`, or `manual-review`)
   - Findings explaining why the verdict was assigned
   - Callback parameters (`code`, `state`, `nonce`, `response_type`)
   - Last captured authorization-request URL and callback URL
4. Use **Clear captured sessions** before testing another flow.

## Interpretation Guide

- `basic-protected`: request included `state`, callback returned matching `state`, and `code` exists.
- `potential-csrf`: request did not include `state`.
- `state-mismatch`: callback `state` differs from request `state`.
- `high-risk`: callback missing `code` or callback missing `state` when request had `state`.
- `manual-review`: callback was captured but a matching auth request was not captured by the extension.

---

For issues or updates, refer to the main repository:
<https://github.com/Waariss/Oauth2.0>
