package com.example.authwithauthcode;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;

import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationRequest;
import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.AuthorizationServiceConfiguration;
import net.openid.appauth.AuthorizationServiceConfiguration.RetrieveConfigurationCallback;
import net.openid.appauth.ResponseTypeValues;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private static final int RC_SIGN_IN = 9001;
    private static final int REQUEST_CODE_SECOND_APP = 1234;

    private TextView statusTextView;
    private AuthorizationService authService;
    private String authorizationUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        statusTextView = findViewById(R.id.status);

        Button signInButton = findViewById(R.id.sign_in_button);
        signInButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                signIn();
            }
        });

        Button signOutButton = findViewById(R.id.sign_out_button);
        signOutButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                signOut();
            }
        });

        authService = new AuthorizationService(this);
    }

    private void signIn() {
        startLogin();
    }

    private void startLogin() {
        Uri redirectUri = Uri.parse("com.example.authwithauthcode:/oauth2redirect");

        AuthorizationServiceConfiguration.fetchFromIssuer(
                Uri.parse("https://accounts.google.com"),
                new RetrieveConfigurationCallback() {
                    @Override
                    public void onFetchConfigurationCompleted(
                            AuthorizationServiceConfiguration config,
                            AuthorizationException ex) {

                        if (ex != null) {
                            Log.e(TAG, "Failed to fetch configuration", ex);
                            Toast.makeText(MainActivity.this, "Failed to fetch configuration", Toast.LENGTH_SHORT).show();
                            return;
                        }

                        AuthorizationRequest authRequest = new AuthorizationRequest.Builder(
                                config,
                                "534226493472-p91kta70e4f2pslibi3et34vtd6673oi.apps.googleusercontent.com",
                                ResponseTypeValues.CODE,
                                redirectUri
                        )
                                .setState(null)
                                .setNonce(null)
                                .setScope("email profile")
                                .build();

                        authorizationUrl = authRequest.toUri().toString();
                        Intent authIntent = authService.getAuthorizationRequestIntent(authRequest);
                        startActivityForResult(authIntent, RC_SIGN_IN);
                        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
                        CustomTabsIntent customTabsIntent = builder.build();
                        customTabsIntent.launchUrl(MainActivity.this,Uri.parse(authorizationUrl));
//                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(authorizationUrl));
//                        intent.setPackage("com.android.chrome");
                    }
                });
    }

    private void signOut() {
        statusTextView.setText("You are not signed in.");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_CODE_SECOND_APP) {
            if (resultCode == RESULT_OK) {
                startLogin();
            } else {
            }
        } else if (requestCode == RC_SIGN_IN) {
            AuthorizationResponse resp = AuthorizationResponse.fromIntent(data);
            AuthorizationException ex = AuthorizationException.fromIntent(data);
            if (resp != null) {
                handleAuthorizationCode();
            } else {
                Log.e(TAG, "Authorization failed", ex);
                Toast.makeText(this, "Authorization failed", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void handleAuthorizationCode() {
        statusTextView.setText("Signed in successfully.");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        authService.dispose();
    }
}

