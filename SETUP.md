# myday2 — Setup Guide

This app is 100% yours now: the full source lives in this repo, nothing is
locked inside a third-party builder, and you can hand this folder to any
developer (or to me) in the future and keep building on it.

## What already works, right now, with zero setup

- Daily To-Do list + reflection journal
- Weekly Habits tracker
- Monthly Goals with milestones
- Long-Term Plans with milestones
- "Daily Focus" trackers (health, food, learning, work, habits, finance)
- Body Archive (progress photos/weight)
- Insights dashboard (streaks, charts)
- **AI Daily Planner** — once you add your own free Gemini key in Settings
- **On-device reminders** for any to-do you give a time — these work fully
  offline, no setup needed
- **Continue as Guest** sign-in, so you can open the app and use everything
  above immediately, before doing any of the steps below

## What needs a one-time setup from you (things only the account owner can do)

### 1. Get a free Gemini API key (2 minutes, unlocks the AI planner)
Go to https://aistudio.google.com/apikey → Create API key → paste it into
the app's **Settings** tab. It's stored only on your device, never sent
anywhere except directly to Google when the AI planner runs.

### 2. Turn on real Google Sign-In, Google Calendar sync & Google Tasks sync
This app reuses the Firebase project your "myday2" AI Studio build already
created: **`gen-lang-client-0342296457`**. To make native Google Sign-In
and Calendar/Tasks sync work inside the installed app, do this once in
[Firebase Console](https://console.firebase.google.com/project/gen-lang-client-0342296457):

1. **Project Settings → General → Your apps → Add app → Android**
   - Android package name: `com.abhi.myday2`
   - Debug signing certificate SHA-1: `7A:FF:1B:E1:47:E0:CE:F7:00:48:1D:21:5A:73:1E:65:94:2C:4A:C3`
     (this is baked into the repo's `android/myday2-debug.keystore` so every
     CI build uses this exact same fingerprint — you only ever need to add
     this once)
   - Download the generated **`google-services.json`**
   - Place it at `android/app/google-services.json` in this repo, commit it,
     and push — the next CI build will pick it up automatically.
2. **Authentication → Sign-in method → enable "Google"**
3. In [Google Cloud Console](https://console.cloud.google.com/apis/library) for
   the same project, enable:
   - **Google Calendar API**
   - **Google Tasks API**
4. **APIs & Services → OAuth consent screen → Data Access** → add these
   scopes: `.../auth/calendar.events` and `.../auth/tasks`
5. Because this app isn't "verified" by Google (that's a longer process for
   apps with many public users), while it's in **Testing** mode only the
   test users you list can use Calendar/Tasks sign-in. Add your own Google
   account (`md25mdes14001@iith.ac.in` or whichever one you use) under
   **OAuth consent screen → Audience → Test users**. This is completely
   normal for a personal app and costs nothing.

Once steps 1–5 are done and a new build runs, "Sign in with Google" and the
Calendar/Tasks "Connect" buttons in Settings will work for real.

### 3. Deploy the updated Firestore security rules
The file `firestore.rules` in this repo now also covers Weekly Habits,
Monthly Goals and Long-Term Plans. Paste its contents into
**Firebase Console → Firestore Database → Rules** and click Publish (or, if
you're comfortable with a terminal: `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules`).

### 4. Getting the APK
Every push to this repo's `main` branch runs a GitHub Action
(`.github/workflows/build-apk.yml`) that builds a ready-to-install APK —
Google's own Android SDK isn't reachable from a generic cloud sandbox, so
this uses GitHub's official Android build runners instead, which is the
standard way to build Android apps without installing Android Studio.

To get the file: open the repo on GitHub → **Actions** tab → the latest
"Build myday2 APK" run → scroll to **Artifacts** → download
`myday2-debug-apk` (or ask me to fetch and send it to you directly).

Install it on an Android phone by opening the downloaded `.apk` and allowing
"install from this source" when prompted (it's not from the Play Store yet,
so Android will ask for that one-time permission).

### 5. Publishing to the Play Store (when you're ready)
This needs a Google Play Console developer account (one-time $25 fee,
identity verification — only you can create this). Once you have it:
1. Generate a dedicated **release keystore** (do not reuse the debug one
   above for your real Play Store release — I can generate this with you
   when the time comes, but you must keep the file and its passwords safe
   forever; losing it means you can never update the app again).
2. Build an `.aab` (Android App Bundle) instead of an `.apk` — same CI
   pipeline, one more Gradle task.
3. Create the app listing in Play Console (screenshots, description,
   privacy policy URL, content rating questionnaire).

None of this blocks using the app today — it's only needed to list it
publicly on the Play Store instead of sharing the APK directly.

## Changing the package name later
`com.abhi.myday2` was picked as a sensible default. If you want a different
one before publishing, it must be changed in `capacitor.config.ts`,
`android/app/build.gradle` (`namespace` + `applicationId`), and
`android/app/src/main/res/values/strings.xml`, then re-registered in
Firebase with a fresh SHA-1 pairing.
