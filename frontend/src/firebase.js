// src/firebase.js
import { initializeApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAP0Nv8UFUgoJgQLkWIO32O80CHwAS5OvI",
  authDomain: "signin-b9952.firebaseapp.com",
  projectId: "signin-b9952",
  storageBucket: "signin-b9952.firebasestorage.app", // (OK, không bắt buộc dùng)
  messagingSenderId: "242072366078",
  appId: "1:242072366078:web:a02880dd87bae18753aeaf",
  measurementId: "G-HYZKR2JMQR",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Lưu phiên đăng nhập trong localStorage
setPersistence(auth, browserLocalPersistence).catch(console.error)

// Ngôn ngữ UI (tùy chọn)
auth.languageCode = "vi"

// GOOGLE provider
export const googleProvider = new GoogleAuthProvider()
// Gợi ý chọn tài khoản mỗi lần (tùy chọn)
googleProvider.setCustomParameters({ prompt: "select_account" })

// FACEBOOK provider
export const facebookProvider = new FacebookAuthProvider()
// Lấy email/profil
facebookProvider.addScope("email")
facebookProvider.addScope("public_profile")
// Bắt dùng popup
facebookProvider.setCustomParameters({ display: "popup" })

export default app
