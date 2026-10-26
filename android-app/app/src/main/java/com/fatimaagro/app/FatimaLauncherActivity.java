package com.fatimaagro.app;

import android.content.Intent;
import android.net.Uri;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

/** The browser owns Fatima origin verification, sessions and permission prompts. */
public final class FatimaLauncherActivity extends LauncherActivity {
    private static final String DEFAULT_ENTRY_URL = "https://fatima-agro.vercel.app/account";

    @Override
    protected Uri getUrlForIntent(Intent intent) {
        Uri url = intent == null ? null : intent.getData();
        if (url == null || !url.isHierarchical()
                || !"https".equalsIgnoreCase(url.getScheme())
                || !"fatima-agro.vercel.app".equalsIgnoreCase(url.getHost())
                || url.getUserInfo() != null
                || (url.getPort() != -1 && url.getPort() != 443)) {
            return Uri.parse(DEFAULT_ENTRY_URL);
        }
        return url;
    }
}

