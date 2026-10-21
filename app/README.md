# Ketan Duggal paintings app

An installable phone app (PWA) for the 21 paintings. No build step, no app store.

## Put it live (GitHub Pages)
The app lives in the `app/` folder of the GitHub repo `ketanduggal/artist-portfolio`.

1. In the repo on GitHub: **Settings > Pages**. Under "Build and deployment" choose
   **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
2. After a minute or two the app is at `https://ketanduggal.github.io/artist-portfolio/app/`.
3. On iPhone, open that address in **Safari**, tap **Share > Add to Home Screen > Add**.
   On Android (Chrome), tap **Install app** at the top, or menu > Install app.

Pages also publishes the rest of the repo, so the website in the repo root appears at
`https://ketanduggal.github.io/artist-portfolio/`.

Any other HTTPS host works too (Netlify, Cloudflare Pages): upload the folder as `app/`.

**Inner Circle sign-ups** are emailed to Ketan through FormSubmit (`signupUrl` in `config.js`).
The very first sign-up sends an activation email to ketanduggal2k11@gmail.com; click the link
in it once, and from then on every sign-up arrives as an email. To use Netlify Forms instead,
set `signupUrl` to `''` and host on Netlify.

## Drop alerts (Firebase Cloud Messaging, free)
Until `config.js` is filled in, the buttons say "Drop alerts coming soon". To switch them on:

1. Go to https://console.firebase.google.com and **Add project** (Google Analytics is optional).
2. On the project page, **Add app > Web** (the `</>` icon). Give it a nickname; skip Firebase Hosting.
   Firebase shows a `firebaseConfig = { ... }` block. Copy the `{ ... }` part into `config.js` as `firebase`.
3. Open **Project settings > Cloud Messaging > Web Push certificates > Generate key pair**.
   Copy the key into `config.js` as `vapidKey`.
4. Bump `VERSION` in `sw.js` and deploy.
5. Turn alerts on in the app on your own phone, then send yourself a test (below).

`config.js` ends up looking like:

```js
self.APP_CONFIG = {
  firebase: { apiKey: '…', authDomain: '…', projectId: '…', storageBucket: '…', messagingSenderId: '…', appId: '…' },
  vapidKey: 'B…'
};
```

These values are meant to be public (they identify the project, they are not passwords).

**Sending a drop alert:** Firebase console > **Messaging** > **New campaign > Notifications**.
Write the title and text, choose the web app as the target, pick "Now", then **Review > Publish**.
Tapping the notification opens the app.

**Testing first:** on a computer, open the app in Chrome, turn alerts on, and open the developer
console: it prints `Drop alerts token: …`. In the campaign screen use **Send test message** with that token.
Do a real test on a phone before relying on alerts for a drop.

Who can get alerts:
- Android and desktop Chrome, Edge, Firefox: yes, from the browser or the installed app.
- iPhone and iPad (iOS 16.4 or newer): only after **Add to Home Screen**, then turning alerts on
  inside the app. The app tells iPhone visitors this.

## What it does
- Home, Vault (all works, filterable by the three eras) and Studio, in light (default) or dark.
- Viewer: swipe between paintings, pinch or double-tap to zoom, tap to hide the controls,
  "The story", Share (phone share sheet) and Inquire (email to Ketan, painting pre-filled).
- **On your wall:** shows the painting to scale on a 2.8 m wall next to a 220 cm sofa or a
  172 cm person, with its width and height marked. Sizes come from `dimensions` in `paintings.json`;
  the words Portrait, Landscape or Square there decide which side is the height.
- Drop alerts (above).
- Each painting has its own link, e.g. `/app/#querencia-2021`.
- Works offline: thumbnails are saved on install and full-size images download in the background.

## Changing things
- Painting details: `paintings.json`. Images: `img/thumb` (640px) and `img/large` (1600px), same file name.
- Inquiry email: `CONTACT_EMAIL` at the top of `app.js`.
- Alerts settings: `config.js`. The alerts worker is `push/firebase-messaging-sw.js` (leave it in `push/`).
- After any change, bump `VERSION` at the top of `sw.js` so installed phones pick it up.
