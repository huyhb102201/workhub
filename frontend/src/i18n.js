// src/i18n.js
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const resources = {
  vi: { translation: {
    title: "Đăng nhập",
    subtitle: "Chào mừng quay lại WorkHub",
    google: "Đăng nhập với Google",
    facebook: "Đăng nhập với Facebook",
    logout: "Đăng xuất",
    loading: "Đang xử lý...",
    lang: "Ngôn ngữ"
  }},
  en: { translation: {
    title: "Sign in",
    subtitle: "Welcome back to WorkHub",
    google: "Continue with Google",
    facebook: "Continue with Facebook",
    logout: "Sign out",
    loading: "Processing...",
    lang: "Language"
  }}
}

i18n.use(initReactI18next).init({
  resources,
  lng: "vi",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
})

export default i18n
