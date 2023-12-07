package com.example.ninka;

import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

public class MainActivity extends AppCompatActivity {

    private static final String PREFS_KEY = "MyPrefs";
    private static final String EXTRA_REDIRECT_URL = "redirectUrl";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
    // buttonを押すとintentを受け取り、URLを表示する
    public void onClick(View myButton) {
        Intent intent = getIntent();
        Uri uri = intent != null ? intent.getData() : null;
        String suri = uri != null ? uri.toString() : "";
        TextView geturl = findViewById(R.id.URLView);
        geturl.setText(suri);
    }

    //ボタンを押すとintentを取得し、URLを変数に格納する。その後URLからstateパラメータとnonceパラメータの値を取得して表示する。ない場合はstate:なしとnonce:なしと表示する。これらはchecksnに表示する。
    public void onClick2(View myButton) {
        Intent intent = getIntent();
        Uri uri = intent.getData();
        TextView getchecksn = findViewById(R.id.checksnView);
        if (uri != null) {
            String state = uri.getQueryParameter("state");
            String nonce = uri.getQueryParameter("nonce");
            if (state != null && nonce != null) {
                getchecksn.setText("State:" + state + "\n" + "Nonce:" + nonce);
            } else if (state != null) {
                getchecksn.setText("State:" + state + "\n" + "Nonce: N/A");
            } else if (nonce != null) {
                getchecksn.setText("State: N/A" + "\n" + "Nonce:" + nonce);
            } else {
                getchecksn.setText("State: N/A" + "\n" + "Nonce: N/A");
            }
        }
    }

    // ボタンを押すとintentから受け取ったURLをChrome Custom Tabsを利用してChromeで開く
    public void onClick4(View myButton) {
        // コンテキストを取得する
        Context context = this;

        // SharedPreferencesを初期化する
        SharedPreferences prefs = context.getSharedPreferences(PREFS_KEY, MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.clear(); // SharedPreferences内の全ての値をクリア
        editor.apply();
        String url = getIntent().getData().toString();
        WebView webView = new WebView(this);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);

        // カスタムのユーザーエージェントを設定
        String userAgent = "Mozilla/5.0 (Linux; Android 12; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Mobile Safari/537.36";
        webSettings.setUserAgentString(userAgent);

        webView.setWebViewClient(new WebViewClient() {
            boolean redirectDetected = false; // リダイレクト検知フラグ

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.contains("code=")) {
                    // リダイレクト時の処理
                    Intent resultIntent = new Intent();
                    resultIntent.putExtra("redirectUrl", url);
                    setResult(RESULT_OK, resultIntent);
                    editor.putString(EXTRA_REDIRECT_URL, url); // リダイレクトURLを保存する
                    editor.apply();
                    redirectDetected = true;
                    // 空のページを読み込んでからfinishする
                    view.loadUrl("about:blank");
                    return false;
                } else {
                    // リダイレクト以外のURLに遷移する場合もデータを保持する
                    Intent resultIntent = new Intent();
                    resultIntent.putExtra("redirectUrl", url);
                    setResult(RESULT_OK, resultIntent);
                    return super.shouldOverrideUrlLoading(view, request);
                }
            }

            //リダイレクトURLを取得しているかつ空のページを読み込んでいる場合はfinishする
            @Override
            public void onPageFinished(WebView view, String url) {
                if (redirectDetected && url.equals("about:blank")) {
                    //WebViewを破棄する
                    webView.destroy();
                    //レイアウトを再表示
                    setContentView(R.layout.activity_main2);
                }
            }
        });
        setContentView(webView);
        webView.loadUrl(url);
    }

    // ボタンを押すとSharedPreferencesに保存されたURLを表示する。ない時はSharedPreferences:なしと表示する。
    public void onClick5(View myButton) {
        SharedPreferences prefs = getSharedPreferences(PREFS_KEY, MODE_PRIVATE);
        String redirectUrl = prefs.getString(EXTRA_REDIRECT_URL, null);
        TextView getsharedprefs = findViewById(R.id.redirectURLView);
        if (redirectUrl != null) {
            getsharedprefs.setText("SharedPreferences:" + redirectUrl);
        } else {
            getsharedprefs.setText("SharedPreferences: N/A");
        }

    }
    //ボタンを押すとSharedPreferencesに保存されたURLをCustomTabsでChromeを開く
    public void onClick6(View myButton) {
        SharedPreferences prefs = getSharedPreferences(PREFS_KEY, MODE_PRIVATE);
        String redirectUrl = prefs.getString(EXTRA_REDIRECT_URL, null);
        if (redirectUrl != null) {
            CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
            CustomTabsIntent customTabsIntent = builder.build();
            customTabsIntent.launchUrl(this, Uri.parse(redirectUrl));
        }
    }


    //ボタンを押すとSharedPreferencesに保存されたURLの認可コードとstateパラメータを取得してcheckに表示する。ない時は無しと表示する。
    public void onClick8(View myButton) {
        SharedPreferences prefs = getSharedPreferences(PREFS_KEY, MODE_PRIVATE);
        String redirectUrl = prefs.getString(EXTRA_REDIRECT_URL, null);
        TextView getsharedprefs = findViewById(R.id.check);
        if (redirectUrl != null) {
            Uri uri = Uri.parse(redirectUrl);
            String code = uri.getQueryParameter("code");
            String state = uri.getQueryParameter("state");
            String nonce = uri.getQueryParameter("nonce");
            if (code != null) {
                if (state != null) {
                    if(nonce!=null){
                        getsharedprefs.setText("Auth Code:" + code + "\n" + "State:" + state + "\n" + "Nonce:" + nonce);
                    }else{
                        getsharedprefs.setText("Auth Code:" + code + "\n" + "State:" + state + "\n" + "Nonce:No");
                    }
                } else {
                    if(nonce!=null){
                        getsharedprefs.setText("Auth Code:" + code + "\n" + "State:No" + "\n" + "Nonce:" + nonce);
                    }else{
                        getsharedprefs.setText("Auth Code:" + code + "\n" + "State:No" + "\n" + "Nonce:No");
                    }
                }
            } else {
                if (state != null) {
                    if (nonce!= null) {
                        getsharedprefs.setText("Auth Code:No" + "\n" + "State:" + state + "\n" + "Nonce:" + nonce);
                    } else {
                        getsharedprefs.setText("Auth Code:No" + "\n" + "State:" + state + "\n" + "Nonce:No");
                    }
                } else {
                    if (nonce != null) {
                        getsharedprefs.setText("Auth Code:No" + "\n" + "State:No" + "\n" + "Nonce:" + nonce);
                    } else {
                        getsharedprefs.setText("Auth Code:No" + "\n" + "State:No" + "\n" + "Nonce:No");
                    }
                }
            }
        }
        Intent intent = getIntent();
        Uri uri2 = intent.getData();
        String state2 = uri2.getQueryParameter("state");
        //stateとstate2が一致するか確認する。一致したらstate:OKと表示する。一致しない場合はstate:NGと表示する。
        if (state2 != null) {
            Uri uri = Uri.parse(redirectUrl);
            String state = uri.getQueryParameter("state");
            if (state2.equals(state)) {
                TextView getstate = findViewById(R.id.stateView);
                getstate.setText("State:OK");
            } else {
                TextView getstate = findViewById(R.id.stateView);
                getstate.setText("State:N/A");
            }
        } else {
            TextView getstate = findViewById(R.id.stateView);
            getstate.setText("No State");
        }
    }
}