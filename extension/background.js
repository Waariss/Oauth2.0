const OAUTH_PARAMETER_KEYS = [
  "code",
  "auth_code",
  "state",
  "nonce",
  "response_type",
  "client_id",
  "redirect_uri",
  "error"
];
const HISTORY_LIMIT = 25;
const OAUTH_PATH_HINT = /(oauth|openid|authorize|callback)/i;

function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function setStorage(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}

function parseUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch (error) {
    return null;
  }
}

function getParamsFromUrl(rawUrl) {
  const parsedUrl = parseUrl(rawUrl);
  if (!parsedUrl) {
    return null;
  }

  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const params = {};

  for (const key of OAUTH_PARAMETER_KEYS) {
    params[key] = parsedUrl.searchParams.get(key) || hashParams.get(key) || null;
  }

  return {
    url: rawUrl,
    origin: parsedUrl.origin,
    path: parsedUrl.pathname,
    host: parsedUrl.host,
    params
  };
}

function isOAuthRelated(payload) {
  const pathLooksRelevant = OAUTH_PATH_HINT.test(payload.path);
  const hasOAuthParameter = Object.values(payload.params).some(Boolean);
  return pathLooksRelevant || hasOAuthParameter;
}

function isAuthorizationRequest(payload) {
  return Boolean(
    payload.params.response_type ||
      payload.params.client_id ||
      payload.params.redirect_uri
  );
}

function isCallback(payload) {
  return Boolean(payload.params.code || payload.params.auth_code || payload.params.error);
}

function createRiskAssessment(session) {
  const findings = [];
  let verdict = "manual-review";
  let severity = "info";

  const requestState = session?.request?.state;
  const callbackState = session?.callback?.state;
  const callbackCode = session?.callback?.authCode;

  if (!session.callback) {
    findings.push("No callback captured yet.");
    return {
      verdict: "incomplete",
      severity: "info",
      findings
    };
  }

  if (!callbackCode) {
    findings.push("Redirect callback has no authorization code.");
    verdict = "high-risk";
    severity = "high";
  } else {
    findings.push("Authorization code found in callback.");
  }

  if (!session.request) {
    findings.push("No matching authorization request captured, assess flow manually.");
    if (verdict !== "high-risk") {
      verdict = "manual-review";
      severity = "medium";
    }
    return { verdict, severity, findings };
  }

  if (!requestState) {
    findings.push("Authorization request had no state parameter.");
    if (verdict !== "high-risk") {
      verdict = "potential-csrf";
      severity = "high";
    }
  } else if (!callbackState) {
    findings.push("Callback is missing state while request included state.");
    verdict = "high-risk";
    severity = "high";
  } else if (callbackState !== requestState) {
    findings.push("State mismatch between request and callback.");
    verdict = "state-mismatch";
    severity = "high";
  } else {
    findings.push("State matched between request and callback.");
    if (callbackCode && verdict !== "high-risk") {
      verdict = "basic-protected";
      severity = "low";
    }
  }

  return { verdict, severity, findings };
}

function toRequestEvent(source, payload) {
  return {
    source,
    capturedAt: new Date().toISOString(),
    url: payload.url,
    state: payload.params.state,
    nonce: payload.params.nonce,
    responseType: payload.params.response_type,
    clientId: payload.params.client_id,
    redirectUri: payload.params.redirect_uri
  };
}

function toCallbackEvent(source, payload) {
  return {
    source,
    capturedAt: new Date().toISOString(),
    url: payload.url,
    authCode: payload.params.code || payload.params.auth_code || null,
    state: payload.params.state,
    nonce: payload.params.nonce,
    responseType: payload.params.response_type,
    error: payload.params.error
  };
}

function canAttachToPendingRequest(pendingRequest, callback) {
  if (!pendingRequest) {
    return false;
  }

  const redirectUri = parseUrl(pendingRequest.redirectUri);
  if (!redirectUri) {
    return true;
  }

  const callbackUrl = parseUrl(callback.url);
  if (!callbackUrl) {
    return false;
  }

  return (
    callbackUrl.origin === redirectUri.origin &&
    callbackUrl.pathname === redirectUri.pathname
  );
}

async function persistSessionFromEvent(source, rawUrl) {
  const payload = getParamsFromUrl(rawUrl);
  if (!payload || !isOAuthRelated(payload)) {
    return;
  }

  const current = await getStorage(["oauthPendingRequest", "oauthSessions"]);
  const sessions = Array.isArray(current.oauthSessions) ? current.oauthSessions : [];
  const pendingRequest = current.oauthPendingRequest || null;

  if (isAuthorizationRequest(payload) && !isCallback(payload)) {
    await setStorage({
      oauthPendingRequest: toRequestEvent(source, payload)
    });
    return;
  }

  if (!isCallback(payload)) {
    return;
  }

  const callback = toCallbackEvent(source, payload);
  const request = canAttachToPendingRequest(pendingRequest, callback) ? pendingRequest : null;
  const session = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    request,
    callback
  };
  session.assessment = createRiskAssessment(session);

  const nextSessions = [session, ...sessions].slice(0, HISTORY_LIMIT);
  await setStorage({
    oauthCapture: session,
    oauthLatestSession: session,
    oauthSessions: nextSessions,
    oauthPendingRequest: request ? null : pendingRequest
  });
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type !== "main_frame") {
      return;
    }

    persistSessionFromEvent("webRequest", details.url);
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== "oauth-url-observed" || typeof message.url !== "string") {
    return;
  }

  persistSessionFromEvent("contentScript", message.url);
});
