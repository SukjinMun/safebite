import { createContext, useContext } from "react";
import { requestJson } from "../../api/request.js";

export const AuthContext = createContext(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Auth components must be inside AuthProvider.");
  return value;
}

export function fetchSession(signal) {
  return requestJson("/api/auth/session", { signal, cache: "no-store" });
}

export function submitAccount(mode, values) {
  return requestJson(`/api/auth/${mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
}

export function endSession() {
  return requestJson("/api/auth/logout", { method: "POST" });
}
