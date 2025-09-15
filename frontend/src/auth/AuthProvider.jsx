import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext({ user: null, loading: true, logout: () => {} });

function readFbProfile() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null); // Google (Firebase)
  const [fbProfile, setFbProfile] = useState(readFbProfile()); // Facebook (localStorage)
  const [loading, setLoading] = useState(true);

  // 1) Lắng nghe Google (Firebase)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    return () => unsub();
  }, []);

  // 2) Theo dõi thay đổi 'user' trong localStorage NGAY CẢ KHI ở cùng tab
  useEffect(() => {
    // patch setItem để phát sự kiện custom khi key 'user' đổi
    const orig = localStorage.setItem;
    localStorage.setItem = function (k, v) {
      const r = orig.apply(this, [k, v]);
      if (k === "user") window.dispatchEvent(new Event("local-user-changed"));
      return r;
    };
    const onLocal = () => setFbProfile(readFbProfile());

    window.addEventListener("local-user-changed", onLocal);
    window.addEventListener("storage", onLocal); // khác tab
    return () => {
      window.removeEventListener("local-user-changed", onLocal);
      window.removeEventListener("storage", onLocal);
      localStorage.setItem = orig; // restore
    };
  }, []);

  // 3) Đánh dấu loading xong khi đã có ít nhất một lần sync
  useEffect(() => {
    // nhỏ gọn: khi mount xong, set loading=false sau tick đầu
    const t = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(t);
  }, []);

  // Hợp nhất: ưu tiên Google -> Facebook
  const user = useMemo(() => {
    if (firebaseUser) {
      return {
        provider: "google",
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photo: firebaseUser.photoURL || "",
      };
    }
    if (fbProfile) {
      // LoginPage đã lưu { name, email, photo } vào localStorage('user')
      return { provider: "facebook", ...fbProfile };
    }
    return null;
  }, [firebaseUser, fbProfile]);

  const logout = async () => {
    localStorage.removeItem("api_token");
    localStorage.removeItem("user");
    setFbProfile(null);
    await signOut(auth).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
