import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

// =================== ENV & API ===================
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const AUTH_URL = `${API_BASE}/api/auth/firebase`; // Google -> Laravel verify Firebase ID token
const SAVE_USER_URL = `${API_BASE}/api/save-user`; // Facebook SDK -> lưu user
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID || "711364211725720"; // đổi nếu cần

// =================== helpers ===================
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

// Load Facebook SDK only once
function useFacebookSDK() {
  const [fbReady, setFbReady] = useState(false);

  useEffect(() => {
    // If already loaded
    if (typeof window !== "undefined" && window.FB) {
      setFbReady(true);
      return;
    }

    // Prepare init callback
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });
      setFbReady(true);
    };

    // Inject script
    const id = "facebook-jssdk";
    if (!document.getElementById(id)) {
      const js = document.createElement("script");
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }

    return () => {
      // không cần cleanup đặc biệt cho FB SDK
    };
  }, []);

  return fbReady;
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const fbReady = useFacebookSDK();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // ============ GOOGLE (Firebase) ============
  const loginWithGoogle = async () => {
    setBusy(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const idToken = await res.user.getIdToken(true);
      const data = await authWithBackend(idToken, "google");
      console.log("Account saved:", data.user ?? data.account ?? data);
      alert("Google login OK");
    } catch (e) {
      console.error(e);
      alert("Google login failed");
    } finally {
      setBusy(false);
    }
  };

  // ============ FACEBOOK (Facebook JS SDK – không qua Firebase) ============
const loginWithFacebookSDK = async () => {
  if (!fbReady || !window.FB) {
    alert("Facebook SDK chưa sẵn sàng, thử lại sau vài giây.");
    return;
  }
  setBusy(true);

  try {
    window.FB.login(
      (response) => {
        if (!response.authResponse) {
          setBusy(false);
          alert("Đăng nhập Facebook bị huỷ");
          return;
        }

        window.FB.api("/me", { fields: "id,name,email,picture" }, async (userInfo) => {
          try {
            const payload = {
              uid: userInfo?.id || "",
              name: userInfo?.name || "",
              email: userInfo?.email || "",
              photoURL: userInfo?.picture?.data?.url || "",
              provider: "facebook",
            };

            const resp = await fetch(`${API_BASE}/api/save-user`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data?.message || "Save user failed");

            if (data.token) localStorage.setItem("api_token", data.token);
            localStorage.setItem(
              "user",
              JSON.stringify({ name: payload.name, email: payload.email, photo: payload.photoURL })
            );

            alert("Facebook login OK");
          } catch (err) {
            console.error("Lỗi lưu user Facebook:", err);
            alert("Facebook login failed");
          } finally {
            setBusy(false);
          }
        });
      },
      { scope: "email,public_profile" }
    );
  } catch (e) {
    console.error(e);
    alert("Facebook login failed");
    setBusy(false);
  }
};


  const logout = async () => {
    localStorage.removeItem("api_token");
    localStorage.removeItem("user");
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
            {/* GOOGLE qua Firebase (giữ nguyên flow cũ) */}
            <button
              onClick={loginWithGoogle}
              disabled={busy}
              className="w-full rounded-lg bg-red-500 text-white px-4 py-2"
            >
              {busy ? t("loading") : t("google")}
            </button>

            {/* FACEBOOK qua Facebook JS SDK */}
            <button
              onClick={loginWithFacebookSDK}
              disabled={busy || !fbReady}
              className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
              title={fbReady ? "" : "Đang tải Facebook SDK..."}
            >
              {busy ? t("loading") : t("facebook")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
