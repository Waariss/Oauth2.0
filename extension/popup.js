document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['authCode', 'state', 'nonce'], function(data) {
        if (data) {
            document.getElementById('authCode').innerText = 'Authorization code: ' + data.authCode;
            document.getElementById("nonce").innerText = "Nonce: " + data.nonce;
            document.getElementById('state').innerText = 'State: ' + data.state;
        }
    });

    document.getElementById('removeCode').addEventListener('click', function() {
        chrome.storage.local.remove(['authCode', 'state', 'nonce'], function() {
            console.log('Authorization code, State, and Nonce removed');
            document.getElementById('authCode').innerText = 'No authorization code yet';
            document.getElementById('state').innerText = 'No state yet';
            document.getElementById('nonce').innerText = 'No nonce yet';
        });
    });
});
