import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

// Extract role robustly no matter how the claim is named/shaped
function extractRole(decoded) {
  if (!decoded) return null;

  // common: "role": "Backoffice"
  if (typeof decoded.role === "string") return decoded.role;

  // long URI claim name
  const ROLE_URI = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
  if (typeof decoded[ROLE_URI] === "string") return decoded[ROLE_URI];

  // arrays
  if (Array.isArray(decoded.role) && decoded.role.length) return decoded.role[0];
  if (Array.isArray(decoded[ROLE_URI]) && decoded[ROLE_URI].length) return decoded[ROLE_URI][0];

  return null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const decoded = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  const user = useMemo(() => {
    const role = extractRole(decoded);
    const username = decoded?.sub || decoded?.unique_name || null;
    return { username, role, raw: decoded };
  }, [decoded]);

  const signIn = (t) => {
    localStorage.setItem("token", t);
    setToken(t);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  // Auto-logout when token expires
  useEffect(() => {
    const exp = decoded?.exp;
    if (!exp) return;
    const ms = exp * 1000 - Date.now();
    if (ms <= 0) { signOut(); return; }
    const id = setTimeout(signOut, ms);
    return () => clearTimeout(id);
  }, [decoded?.exp]);

  return (
    <Ctx.Provider value={{ token, user, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
