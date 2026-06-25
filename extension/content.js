chrome.runtime.sendMessage({
  type: "oauth-url-observed",
  url: window.location.href
});
