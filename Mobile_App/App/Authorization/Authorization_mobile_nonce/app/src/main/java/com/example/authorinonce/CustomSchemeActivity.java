package com.example.authorinonce;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;

public class CustomSchemeActivity extends AppCompatActivity {

    private static final String TAG = "CustomSchemeActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleCallbackIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleCallbackIntent(intent);
    }

    private void handleCallbackIntent(Intent intent) {
        Uri dataUri = intent.getData();
        Log.d(TAG, "Data URI: " + dataUri);
        if (dataUri != null && dataUri.toString().startsWith("com.example.authorinonce:/oauth2callback")) {
            String authorizationCode = dataUri.getQueryParameter("code");
            Log.d(TAG, "Authorization code: " + authorizationCode);
            if (authorizationCode != null) {
                Intent mainIntent = new Intent(this, MainActivity.class);
                mainIntent.putExtra("authorization_code", authorizationCode);
                startActivity(mainIntent);
            } else {
                Log.e(TAG, "Authorization error. No code found in the URI.");
            }
        } else {
            Log.e(TAG, "Invalid data URI.");
        }
        finish();
    }
}
