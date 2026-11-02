# November Challenge

A small, phone-first habit tracker for a 30-day challenge. No accounts, no server: everything is saved in the browser on your own phone.

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
- **Setup** – set each goal to Cert / Best shot / Drop, adjust targets, and back up or restore your log
- Installable: add it to your Home Screen and it opens full-screen and works offline

## Tips

- Open it from the Home Screen icon every time (the icon and Safari keep separate copies of your data).
- Don't use a private/incognito tab — it forgets everything when closed.
- Use **Setup → Backup** every week or so.

## Tech

Plain HTML, CSS and JavaScript in a single `index.html` — no framework or build step. Data lives in `localStorage`; a service worker (`sw.js`) caches the app for offline use. Hosted on GitHub Pages.
