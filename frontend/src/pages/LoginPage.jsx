import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { auth, googleProvider, facebookProvider } from "../firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const AUTH_URL = `${API_BASE}/api/auth/firebase`;

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function authWithBackend(idToken, provider) {
    const r = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ provider }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.message || "Backend auth failed");
    if (data.token) localStorage.setItem("api_token", data.token);
    return data;
  }

  const loginWithProvider = async (providerName) => {
    setBusy(true);
    try {
      const provider = providerName === "google" ? googleProvider : facebookProvider;
      const res = await signInWithPopup(auth, provider);
      const idToken = await res.user.getIdToken(true);
      const data = await authWithBackend(idToken, providerName);
      console.log("Account saved:", data.user ?? data.account ?? data);
      alert(`${providerName} login OK`);
    } catch (e) {
      console.error(e);
      alert(`${providerName} login failed`);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("api_token");
    await signOut(auth);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        <p className="text-gray-500">{t("subtitle")}</p>

        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={user.photoURL ?? ""} className="h-10 w-10 rounded-full" />
              <div>{user.displayName}</div>
            </div>
            <button onClick={logout} className="w-full rounded-lg border px-4 py-2 hover:bg-gray-50">
              {t("logout")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => loginWithProvider("google")}
              disabled={busy}
              className="w-full rounded-lg bg-red-500 text-white px-4 py-2"
            >
              {busy ? t("loading") : t("google")}
            </button>
            <button
              onClick={() => loginWithProvider("facebook")}
              disabled={busy}
              className="w-full rounded-lg bg-blue-600 text-white px-4 py-2"
            >
              {busy ? t("loading") : t("facebook")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
