package com.example.ninka;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;

import java.util.List;

public class MainActivity extends AppCompatActivity {

    String authorizationUrl;
    String appName;
    String authCode;

    TextView appNameView;
    TextView getUrl;
    TextView getState;
    TextView getNonce;
    TextView getCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        getUrl = findViewById(R.id.URLView);
        getState = findViewById(R.id.stateView);
        getNonce = findViewById(R.id.nonceView);
        getCode = findViewById(R.id.codeView);

        Button btnUrl = findViewById(R.id.btnUrl);
        Button btnState = findViewById(R.id.btnState);
        Button btnNonce = findViewById(R.id.btnNonce);
        Button btnCode = findViewById(R.id.btnCode);
        Button btnOpenInBrowser = findViewById(R.id.btnOpenInBrowser);

        btnUrl.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = getIntent();
                Uri authorizationUrl = intent != null ? intent.getData() : null;
                getUrl.setText("URL: " + (authorizationUrl != null ? authorizationUrl : "N/A"));
            }
        });

        btnState.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = getIntent();
                Uri uri = intent.getData();
                if (uri != null) {
                    String state = uri.getQueryParameter("state");
                    getState.setText("State: " + (state != null ? state : "N/A"));
                } else {
                    getState.setText("State: N/A");
                }
            }
        });

        btnNonce.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = getIntent();
                Uri uri = intent.getData();
                if (uri != null) {
                    String nonce = uri.getQueryParameter("nonce");
                    getNonce.setText("Nonce: " + (nonce != null ? nonce : "N/A"));
                } else {
                    getNonce.setText("Nonce: N/A");
                }
            }
        });

        btnCode.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                getCode.setText("Auth Code: " + (authCode != null ? authCode : "N/A"));
            }
        });

        btnOpenInBrowser.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                openInBrowser();
            }
        });

        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null) {
            authorizationUrl = intent.getStringExtra("AuthorizationUrl");
            appName = intent.getStringExtra("AppName");

            Uri uri = intent.getData();
            if (uri != null) {
                authCode = uri.getQueryParameter("code");
            }
            if (authorizationUrl != null) {
                Uri uriCheck = Uri.parse(authorizationUrl);

                String stateCheck = uriCheck.getQueryParameter("state");
                String nonceCheck = uriCheck.getQueryParameter("nonce");
            }
            updateUI();
        }
    }

    private void updateUI() {
        if (appName != null) {
            appNameView.setText(appName);
        }
    }

    private void openInBrowser() {
        Intent intent = getIntent();
        Uri authorizationUrl = intent.getData();
        if (authorizationUrl != null) {
            CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
            CustomTabsIntent customTabsIntent = builder.build();
            customTabsIntent.intent.setPackage("com.android.chrome");
            customTabsIntent.launchUrl(this, authorizationUrl);
        }
    }
}
