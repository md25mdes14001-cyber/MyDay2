# myday2

Personal life operating system — to-do list, weekly habits, monthly goals,
long-term plans, daily focus trackers, body archive, insights, and an AI
daily planner. Built with React + Vite + Firebase, packaged as a native
Android app with Capacitor.

See **[SETUP.md](./SETUP.md)** for how to get the app running on your
phone and turn on Google Sign-In, Calendar sync, Tasks sync, and the AI
planner.

## Local development

```bash
npm install
npm run dev
```

## Building the Android app

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

(Or just push to `main` — GitHub Actions builds the APK for you; see
SETUP.md.)
