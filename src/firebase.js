// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDxrQGvIu7--qRC01-gwSkZBk28ZvtJId8",
  authDomain: "map-project-67c93.firebaseapp.com",
  projectId: "map-project-67c93",
  storageBucket: "map-project-67c93.appspot.com",
  messagingSenderId: "644126446624",
  appId: "1:644126446624:web:503c69b130e42b0a52d845",
  measurementId: "G-K1DKKSKDH4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
