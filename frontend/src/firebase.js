// src/firebase.js
import { initializeApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAP0Nv8UFUgoJgQLkWIO32O80CHwAS5OvI",
  authDomain: "signin-b9952.firebaseapp.com",
  projectId: "signin-b9952",
  storageBucket: "signin-b9952.firebasestorage.app",
  messagingSenderId: "242072366078",
  appId: "1:242072366078:web:a02880dd87bae18753aeaf",
  measurementId: "G-HYZKR2JMQR"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

setPersistence(auth, browserLocalPersistence)

export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()
facebookProvider.addScope("email")
