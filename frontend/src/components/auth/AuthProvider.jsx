import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  AuthContext,
  endSession,
  fetchSession,
  submitAccount,
} from "./auth.js";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);
  const workingRef = useRef(false);

  const refreshSession = useCallback(async (signal, showLoading = false) => {
    if (workingRef.current) return;
    const version = ++requestVersion.current;
    if (showLoading) setLoading(true);
    try {
      const data = await fetchSession(signal);
      if (!signal?.aborted && version === requestVersion.current) {
        setUser(data.user);
        setError("");
      }
    } catch {
      if (!signal?.aborted && version === requestVersion.current) {
        setError("Could not check your sign-in session.");
      }
    } finally {
      if (!signal?.aborted && version === requestVersion.current)
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshSession(controller.signal);
    const refresh = () => refreshSession();
    window.addEventListener("focus", refresh);
    window.addEventListener("safebite:session-changed", refresh);
    return () => {
      controller.abort();
      requestVersion.current += 1;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("safebite:session-changed", refresh);
    };
  }, [refreshSession]);

  async function runAccountAction(action) {
    if (workingRef.current)
      throw new Error("Another account action is running.");
    workingRef.current = true;
    requestVersion.current += 1;
    setWorking(true);
    try {
      const data = await action();
      setUser(data?.user ?? null);
      setError("");
      setMode(null);
    } finally {
      setLoading(false);
      workingRef.current = false;
      setWorking(false);
    }
  }

  const value = {
    user,
    mode,
    loading,
    working,
    error,
    openAuth: (nextMode = "login") => setMode(nextMode),
    closeAuth: () => {
      if (!workingRef.current) setMode(null);
    },
    refreshSession,
    signIn: (values) => runAccountAction(() => submitAccount("login", values)),
    register: (values) =>
      runAccountAction(() => submitAccount("register", values)),
    signOut: () => runAccountAction(endSession),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };
export default AuthProvider;
