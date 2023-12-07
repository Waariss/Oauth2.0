chrome.storage.local.get(['authCode', 'state', 'nonce'], function(data) {
  if (data.authCode) {
    alert('Authorization code: ' + data.authCode);
    alert('State: ' + data.state);
    alert('Nonce: ' + data.nonce); 
    document.getElementById('nonce').innerText = "Nonce: " + data.nonce;
    chrome.storage.local.remove(['authCode', 'state', 'nonce'], function() {
      console.log('Authorization code, State and Nonce removed'); 
    });
  }

  var url = window.location.href;
  if (url.includes('accounts.google.com')){
      var params = new URLSearchParams(url);
  
      var codeFound = params.has('response_type') && params.get('response_type') === 'code';
      var stateFound = params.has('state');
      var nonceFound = params.has('nonce'); 
  
      if (codeFound && stateFound && nonceFound) { 
      alert('Auth Code, State Parameter and Nonce found.'); 
      } else if (codeFound && !stateFound && nonceFound) { 
      alert('Auth Code and Nonce found, but State Parameter is missing.');
      } else if (!codeFound && !stateFound && !nonceFound) { 
      alert('No Auth Code, no State Parameter and no Nonce found.'); 
      } else if (!codeFound && stateFound && nonceFound) { 
      alert('No Auth Code found, but State Parameter and Nonce found.'); 
      } else if (codeFound && stateFound && !nonceFound) { 
      alert('Auth Code and State Parameter found, but Nonce is missing.'); 
      } else if (codeFound && !stateFound && !nonceFound) { 
      alert('Auth Code found, but State Parameter and Nonce are missing.'); 
      } else if (!codeFound && stateFound && !nonceFound) { 
      alert('State Parameter found, but Auth Code and Nonce are missing.'); 
      } else if (!codeFound && !stateFound && nonceFound) { 
      alert('Nonce found, but Auth Code and State Parameter are missing.'); 
      }
  }
});
