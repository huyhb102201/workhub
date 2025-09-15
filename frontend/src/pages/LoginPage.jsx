import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";


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
    if (typeof window !== "undefined" && window.FB) {
      setFbReady(true);
      return;
    }
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });
      setFbReady(true);
    };
    const id = "facebook-jssdk";
    if (!document.getElementById(id)) {
      const js = document.createElement("script");
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }
  }, []);

  return fbReady;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null); // Firebase user (Google)
  const [profile, setProfile] = useState(() => {
    // Facebook profile (tự quản lý)
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
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
      if (data?.user?.id != null) {
  localStorage.setItem("account_id", String(data.user.id));
}
      // Đồng bộ hiển thị giống Facebook (tuỳ chọn)
      const g = {
        name: res.user.displayName || "",
        email: res.user.email || "",
        photo: res.user.photoURL || "",
      };
      localStorage.setItem("user", JSON.stringify(g));
      setProfile(g);

      navigate(location.state?.from || "/", { replace: true });
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

              const resp = await fetch(SAVE_USER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const data = await resp.json().catch(() => ({}));
              if (!resp.ok) throw new Error(data?.message || "Save user failed");

              if (data.token) localStorage.setItem("api_token", data.token);
              if (data?.user?.id != null) {
    localStorage.setItem("account_id", String(data.user.id));
  }
              // CẬP NHẬT STATE HIỂN THỊ NGAY TẠI ĐÂY
              const ui = { name: payload.name, email: payload.email, photo: payload.photoURL };
              localStorage.setItem("user", JSON.stringify(ui));
              setProfile(ui);
              navigate(location.state?.from || "/", { replace: true });
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
    localStorage.removeItem("account_id");
    setProfile(null);           // <— clear facebook profile
    await signOut(auth);        // <— clear firebase user (google)
    setUser(null);
  };

  // ----- UI hiển thị: ưu tiên Firebase user (Google), nếu không có thì dùng profile (Facebook) -----
  const display = user
    ? { name: user.displayName, email: user.email, photo: user.photoURL }
    : profile;

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

      {/* Luôn hiển thị nút login, không show user info */}
      <div className="space-y-3">
        {/* GOOGLE qua Firebase */}
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
    </div>
  </div>
);
}
