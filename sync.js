// Optional cloud sync with Firebase (Auth + Firestore).
// The app works fully without it: localStorage stays the on-device copy,
// and this module keeps one Firestore document per signed-in user in step with it.
import {
  initializeApp,
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut,
  getFirestore, doc, onSnapshot, setDoc,
} from './firebase.js';

const firebaseConfig = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'november-challenge-693d5.firebaseapp.com',
  projectId: 'november-challenge-693d5',
  storageBucket: 'november-challenge-693d5.firebasestorage.app',
  messagingSenderId: '746233655781',
  appId: 'PASTE_APP_ID',
};

const CHALLENGE_ID = 'nov2026';
const app = window.ncApp;
const sync = { available: false, user: null, busy: false, message: '', messageOk: false, lastEmail: '' };
window.ncSync = sync;

const clone = o => JSON.parse(JSON.stringify(o));
const hasData = s => !!s && (s.updatedAt > 0 || Object.keys(s.days || {}).length > 0);
const dayEmpty = d => !d || Object.values(d).every(v => v === '' || v === false || v === 0 || v == null || (Array.isArray(v) && v.every(x => !x)));

// First contact between a device and the cloud: keep the newer copy, but don't
// throw away days or weeks that only the other copy has.
function mergeStates(a, b) {
  const newer = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
  const older = newer === a ? b : a;
  const out = clone(newer);
  out.days = out.days || {}; out.weeks = out.weeks || {};
  for (const [k, v] of Object.entries(older.days || {})) if (dayEmpty(out.days[k]) && !dayEmpty(v)) out.days[k] = v;
  for (const [k, v] of Object.entries(older.weeks || {})) if (!out.weeks[k] || !out.weeks[k].album) { if (v && v.album) out.weeks[k] = v; }
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  return out;
}

function say(message, ok = false) { sync.message = message; sync.messageOk = ok; app.refreshAccount(); }

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Email or password not recognised.',
  'auth/wrong-password': 'Email or password not recognised.',
  'auth/user-not-found': 'No account with that email — tap Create account.',
  'auth/email-already-in-use': 'There’s already an account with that email — tap Sign in.',
  'auth/weak-password': 'Password needs at least 6 characters.',
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/missing-password': 'Enter your password.',
  'auth/network-request-failed': 'No connection — try again when you’re online.',
  'auth/too-many-requests': 'Too many attempts — wait a few minutes and try again.',
  'auth/unauthorized-domain': 'This site isn’t authorised in Firebase yet.',
};
const authError = e => AUTH_ERRORS[e && e.code] || 'Something went wrong — please try again.';

if (firebaseConfig.apiKey.startsWith('PASTE')) {
  app.refreshAccount();
} else {
  const fb = initializeApp(firebaseConfig);
  const auth = getAuth(fb);
  const db = getFirestore(fb);
  sync.available = true;

  let ref = null, unsub = null, firstSnap = true;
  let writing = false, again = false, timer = null;

  async function flush() {
    if (!ref) return;
    if (writing) { again = true; return; }
    writing = true;
    app.setSync(navigator.onLine === false ? 'offline' : 'busy');
    try {
      await setDoc(ref, clone(app.getState()));
      app.setSync('ok');
    } catch (e) {
      app.setSync(navigator.onLine === false ? 'offline' : 'warn');
    }
    writing = false;
    if (again) { again = false; flush(); }
  }

  sync.schedule = () => {
    if (!ref) return;
    app.setSync(navigator.onLine === false ? 'offline' : 'busy');
    clearTimeout(timer);
    timer = setTimeout(flush, 800);
  };

  sync.signIn = async (email, pass, create) => {
    if (!email) return say('Enter your email.');
    if (!pass) return say('Enter your password.');
    sync.lastEmail = email; sync.busy = true; say('');
    try {
      if (create) await createUserWithEmailAndPassword(auth, email, pass);
      else await signInWithEmailAndPassword(auth, email, pass);
      sync.busy = false; say('');
    } catch (e) {
      sync.busy = false; say(authError(e));
    }
  };

  sync.reset = async email => {
    if (!email) return say('Type your email above first, then tap Forgot password.');
    sync.lastEmail = email;
    try { await sendPasswordResetEmail(auth, email); say('Reset email sent — check your inbox (and spam).', true); }
    catch (e) { say(authError(e)); }
  };

  sync.signOut = async () => {
    await signOut(auth);
    say('Signed out. Your log stays on this device.', true);
  };

  onAuthStateChanged(auth, user => {
    if (unsub) { unsub(); unsub = null; }
    clearTimeout(timer);
    sync.user = user ? { email: user.email } : null;
    ref = null;
    if (!user) { app.setSync('local'); app.refreshAccount(); return; }

    ref = doc(db, 'users', user.uid, 'challenges', CHALLENGE_ID);
    firstSnap = true;
    app.setSync('busy');
    app.refreshAccount();

    unsub = onSnapshot(ref, snap => {
      if (snap.metadata.hasPendingWrites) return;
      const local = app.getState();

      if (!snap.exists()) {
        firstSnap = false;
        if (hasData(local)) flush(); else app.setSync('ok');
        return;
      }
      const remote = snap.data();

      if (firstSnap) {
        firstSnap = false;
        const merged = mergeStates(local, remote);
        const m = JSON.stringify(merged);
        if (m !== JSON.stringify(local)) app.replaceState(merged);
        if (m !== JSON.stringify(remote)) flush(); else app.setSync('ok');
        return;
      }

      if ((remote.updatedAt || 0) > (local.updatedAt || 0)) app.replaceState(remote);
      else if ((remote.updatedAt || 0) < (local.updatedAt || 0)) { flush(); return; }
      if (!writing) app.setSync('ok');
    }, () => app.setSync('warn'));
  });

  window.addEventListener('online', () => { if (ref) flush(); });
  window.addEventListener('offline', () => { if (ref) app.setSync('offline'); });
}
