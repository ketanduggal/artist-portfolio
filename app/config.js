// App settings, read by the page and by the notification worker.
self.APP_CONFIG = {
  // Inner Circle sign-ups are emailed to Ketan through FormSubmit (free, no account).
  // The very first sign-up sends Ketan an activation email; click it once and sign-ups start arriving.
  // Leave empty to use Netlify Forms instead (only when hosted on Netlify).
  signupUrl: 'https://formsubmit.co/ajax/ketanduggal2k11@gmail.com',

  // Drop alerts use Firebase Cloud Messaging. To switch them on, paste in:
  //   firebase: the "firebaseConfig" object from Firebase console > Project settings > Your apps > Web app
  //   vapidKey: the key pair from Project settings > Cloud Messaging > Web Push certificates
  // While these are empty, the "drop alerts" buttons say alerts are coming soon. Project: ketan-duggal-paintings.
  firebase: {
    apiKey: 'AIzaSyCRkzzLFJaCSsvK5iTpPT_GS5Q-g4unLuU',
    authDomain: 'ketan-duggal-paintings.firebaseapp.com',
    projectId: 'ketan-duggal-paintings',
    storageBucket: 'ketan-duggal-paintings.firebasestorage.app',
    messagingSenderId: '760118689093',
    appId: '1:760118689093:web:9cfe9053dc2985b2b9522c'
  },
  vapidKey: 'BBEXhPIskM5mxir9zDCa_9nZ29qj-VkfjsEtXNrtnP0oLpBXyakV9EUsLFINEl6dKIYDk0W-Bqrv1IG1ZGtR0mA'
};
