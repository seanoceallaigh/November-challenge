# November Challenge

A small, phone-first habit tracker for a 30-day challenge. Works straight away with no account (saved on your phone), with optional sign-in to sync between devices.

**Use it:** https://seanoceallaigh.github.io/November-challenge/

## The challenge

- No alcohol
- Eggs every day
- Lots more water
- 6–7 hours of sleep
- 8k steps a day
- Max push-ups daily
- Write 3 things you're grateful for
- Screen time reduction
- Max 1 takeaway a week
- 4 new albums (1 a week)
- Whole-body stretch daily

Pick your absolute certs 🟢 and hit them 100%, give the others your best shot 🟠, and drop one or two you know you can't commit to 🔴.

## Features

- **Today** – tick-offs, steppers and quick inputs for each goal, with a progress ring and cert count
- **Month** – calendar heat map, per-goal streaks, push-up progress and the weekly albums
- **Setup** – set each goal to Cert / Best shot / Drop, adjust targets, sign in to sync, and back up or restore your log
- Optional sync: sign in with email and password and your log follows you between phone and computer
- Installable: add it to your Home Screen and it opens full-screen and works offline

## Tips

- Not signed in? Open it from the Home Screen icon every time (the icon and Safari keep separate copies of your data).
- Don't use a private/incognito tab — it forgets everything when closed.
- Use **Setup → Backup** every week or so.

## Tech

Plain HTML, CSS and JavaScript — no framework or build step for the app itself.

- `index.html` – the whole app; data is kept in `localStorage`
- `sync.js` – optional sync using Firebase Authentication (email/password) and Cloud Firestore, one document per user at `users/{uid}/challenges/nov2026`; on first sign-in the device copy and cloud copy are merged
- `firebase.js` – a bundled copy of the Firebase JS SDK (v13.2.0, built with esbuild) so the app doesn't depend on a third-party CDN
- `sw.js` – service worker that caches the app for offline use
- Hosted on GitHub Pages

### Firestore rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/challenges/{challengeId} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['v','updatedAt','settings','days','weeks']);
    }
  }
}
```
