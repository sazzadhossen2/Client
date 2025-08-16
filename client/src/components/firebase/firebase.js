// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import {getAuth} from "firebase/auth";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAGnxvOhnPfdw4Jaf0H6dBfac7aJ1HffFI",
//   authDomain: "watertempok.firebaseapp.com",
//   databaseURL: "https://watertempok-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "watertempok",
//   storageBucket: "watertempok.firebasestorage.app",
//   messagingSenderId: "575253185128",
//   appId: "1:575253185128:web:39a74f3dc2a762c6a671dd",
//   measurementId: "G-3LWB4HGHN0"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// const auth =getAuth(app);

// export { app, analytics, auth };


// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAGnxvOhnPfdw4Jaf0H6dBfac7aJ1HffFI",
  authDomain: "watertempok.firebaseapp.com",
  databaseURL: "https://watertempok-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "watertempok",
  storageBucket: "watertempok.firebasestorage.app",
  messagingSenderId: "575253185128",
  appId: "1:575253185128:web:39a74f3dc2a762c6a671dd",
  measurementId: "G-3LWB4HGHN0",
};

const app = initializeApp(firebaseConfig);

// Only call analytics in browser environments that support it
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
 print(e)
}

const auth = getAuth(app);
const db = getDatabase(app);

export { app, analytics, auth, db };
