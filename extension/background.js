chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    var url = new URL(details.url);
    var authCode = url.searchParams.get('code') || url.searchParams.get('auth_code');
    var state = url.searchParams.get('state');
    var nonce = url.searchParams.get('nonce');
    
    if (authCode) {
      console.log(`Authorization code: ${authCode}`);
      chrome.storage.local.set({ authCode: authCode }, function() {
        console.log('Auth Code is set to ' + authCode);
      });
    }
    
    if (state) {
      console.log(`State: ${state}`);
      chrome.storage.local.set({ state: state }, function() {
        console.log('State is set to ' + state);
      });
    }
    
    if (nonce) {
      console.log(`Nonce: ${nonce}`);
      chrome.storage.local.set({ nonce: nonce }, function() {
        console.log('Nonce is set to ' + nonce);
      });
    }
    
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);
