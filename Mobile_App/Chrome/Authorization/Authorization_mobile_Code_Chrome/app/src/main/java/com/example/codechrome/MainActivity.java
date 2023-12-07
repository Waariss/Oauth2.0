package com.example.codechrome;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
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
import net.openid.appauth.TokenResponse;

import com.bumptech.glide.Glide;

import java.util.UUID;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;


public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private static final int RC_SIGN_IN = 9001;

    private TextView statusTextView;
    private Intent savedIntent;
    private String authorizationUrl;
    private AuthorizationService authService;
    private OkHttpClient httpClient = new OkHttpClient();

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
        Uri redirectUri = Uri.parse("com.example.codechrome:/oauth2callback");

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
                                "883559688036-6itsi82r3h8jbpid8d175dgg233ctb2e.apps.googleusercontent.com",
                                ResponseTypeValues.CODE,
                                redirectUri
                        )
                                .setState(null)
                                .setNonce(null)
                                .setScope("email profile openid")
                                .build();

                        authorizationUrl = authRequest.toUri().toString();
                        Intent authIntent = authService.getAuthorizationRequestIntent(authRequest);
                        startActivityForResult(authIntent, RC_SIGN_IN);
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(authorizationUrl));
                        intent.setPackage("com.android.chrome");
                    }
                });
    }

    private void signOut() {
        statusTextView.setText("You are not signed in.");
        ImageView profilePicture = findViewById(R.id.profile_picture);
        profilePicture.setImageDrawable(null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        String action = intent.getAction();
        Uri data = intent.getData();
        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String state = data.getQueryParameter("state");
            String authorizationCode = data.getQueryParameter("code");

            if (state != null && authorizationCode != null) {
                handleAuthorizationCode(authorizationCode, state);
            } else {
                if (state == null) {
                    Log.e(TAG, "Login Failed: State not received");
                    Toast.makeText(this, "Login Failed: State not received", Toast.LENGTH_SHORT).show();
                }
                if (authorizationCode == null) {
                    Log.e(TAG, "Login Failed: Authorization code not received");
                    Toast.makeText(this, "Login Failed: Authorization code not received", Toast.LENGTH_SHORT).show();
                }
            }
        }
    }

    private void handleAuthorizationCode(String authorizationCode, String state) {
        AuthorizationResponse resp = AuthorizationResponse.fromIntent(savedIntent);
        if (resp != null) {
            authService.performTokenRequest(
                    resp.createTokenExchangeRequest(),
                    new AuthorizationService.TokenResponseCallback() {
                        @Override
                        public void onTokenRequestCompleted(
                                TokenResponse tokenResponse,
                                AuthorizationException ex) {
                            if (ex == null) {
                                String accessToken = tokenResponse.accessToken;
                                fetchUserProfileFromServer(accessToken);
                            } else {
                                Log.e(TAG, "Token request failed", ex);
                                Toast.makeText(MainActivity.this, "Login Failed", Toast.LENGTH_SHORT).show();
                                statusTextView.setText("Login Failed");
                            }
                        }
                    }
            );
        } else {
            Log.e(TAG, "Login Failed: Authorization failed");
            Toast.makeText(this, "Login Failed", Toast.LENGTH_SHORT).show();
            statusTextView.setText("Login Failed");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == RC_SIGN_IN) {
            AuthorizationResponse resp = AuthorizationResponse.fromIntent(data);
            AuthorizationException ex = AuthorizationException.fromIntent(data);
            if (resp != null) {
                authService.performTokenRequest(
                        resp.createTokenExchangeRequest(),
                        new AuthorizationService.TokenResponseCallback() {
                            @Override
                            public void onTokenRequestCompleted(
                                    TokenResponse tokenResponse,
                                    AuthorizationException ex) {
                                if (ex == null) {
                                    String accessToken = tokenResponse.accessToken;
                                    fetchUserProfileFromServer(accessToken);
                                } else {
                                    Log.e(TAG, "Token request failed", ex);
                                    Toast.makeText(MainActivity.this, "Login Failed", Toast.LENGTH_SHORT).show();
                                    statusTextView.setText("Login Failed");
                                }
                            }
                        }
                );
            } else {
                Log.e(TAG, "Login Failed: Authorization failed", ex);
                Toast.makeText(this, "Login Failed", Toast.LENGTH_SHORT).show();
                statusTextView.setText("Login Failed");
            }
        }
    }


    private void fetchUserProfileFromServer(String accessToken) {
        Request request = new Request.Builder()
                .url("https://www.googleapis.com/userinfo/v2/me")
                .addHeader("Authorization", "Bearer " + accessToken)
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Failed to fetch user profile", e);
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Failed to fetch user profile", Toast.LENGTH_SHORT).show());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    Log.e(TAG, "Unexpected HTTP response: " + response);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Failed to fetch user profile", Toast.LENGTH_SHORT).show());
                    return;
                }

                try {
                    JSONObject json = new JSONObject(response.body().string());
                    String name = json.optString("name");
                    String email = json.optString("email");
                    String pictureUrl = json.optString("picture");

                    runOnUiThread(() -> {
                        statusTextView.setText("Signed in successfully.\n"
                                + "Name: " + name + "\n"
                                + "Email: " + email);
                        ImageView profilePicture = findViewById(R.id.profile_picture);
                        Glide.with(MainActivity.this).load(pictureUrl).into(profilePicture);
                    });
                } catch (JSONException e) {
                    Log.e(TAG, "Failed to parse user profile", e);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Failed to parse user profile", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        authService.dispose();
    }
}