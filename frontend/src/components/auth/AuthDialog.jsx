import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth.js";
import "./AuthDialog.css";

const EMPTY = { username: "", displayName: "", password: "" };

function AuthDialog() {
  const { mode, working, closeAuth, openAuth, signIn, register } = useAuth();
  const dialogRef = useRef(null);
  const usernameRef = useRef(null);
  const errorRef = useRef(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const isRegister = mode === "register";

  useEffect(() => {
    setValues(EMPTY);
    setErrors({});
    setMessage("");
    const dialog = dialogRef.current;
    if (mode) {
      if (!dialog.open) dialog.showModal();
      usernameRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [mode]);

  function change(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    if (working) return;
    setErrors({});
    setMessage("");
    try {
      await (isRegister
        ? register(values)
        : signIn({ username: values.username, password: values.password }));
    } catch (error) {
      setErrors(error.fieldErrors || {});
      setMessage(
        error.status
          ? error.message
          : "Could not reach SafeBite. Please try again.",
      );
      // Wait for the error message to enter the document before focusing it.
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <dialog
      className="auth-dialog"
      ref={dialogRef}
      aria-labelledby="auth-title"
      aria-describedby="auth-intro"
      onCancel={(event) => {
        event.preventDefault();
        closeAuth();
      }}
    >
      <div className="auth-dialog__header">
        <h2 id="auth-title">
          {isRegister ? "Create an account" : "Sign in to SafeBite"}
        </h2>
        <button
          className="auth-dialog__close"
          type="button"
          onClick={closeAuth}
          disabled={working}
          aria-label="Close sign-in form"
        >
          ×
        </button>
      </div>
      <p id="auth-intro">
        Share community observations and manage your own reports.
      </p>

      {message && (
        <p
          className="auth-dialog__error"
          role="alert"
          ref={errorRef}
          tabIndex={-1}
        >
          {message}
        </p>
      )}

      <form onSubmit={submit} aria-busy={working}>
        <label htmlFor="auth-username">Username</label>
        <input
          ref={usernameRef}
          id="auth-username"
          name="username"
          value={values.username}
          onChange={change}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={3}
          maxLength={30}
          pattern={"[A-Za-z0-9_\\-]{3,30}"}
          disabled={working}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={
            errors.username
              ? "auth-username-help auth-username-error"
              : "auth-username-help"
          }
        />
        <small id="auth-username-help">
          3–30 letters, numbers, underscores, or hyphens.
        </small>
        {errors.username && (
          <p className="auth-dialog__field-error" id="auth-username-error">
            {errors.username}
          </p>
        )}

        {isRegister && (
          <>
            <label htmlFor="auth-display-name">Display name</label>
            <input
              id="auth-display-name"
              name="displayName"
              value={values.displayName}
              onChange={change}
              autoComplete="nickname"
              required
              minLength={2}
              maxLength={60}
              disabled={working}
              aria-invalid={Boolean(errors.displayName)}
              aria-describedby={
                errors.displayName
                  ? "auth-name-help auth-name-error"
                  : "auth-name-help"
              }
            />
            <small id="auth-name-help">
              Shown with your community reports. A nickname is fine.
            </small>
            {errors.displayName && (
              <p className="auth-dialog__field-error" id="auth-name-error">
                {errors.displayName}
              </p>
            )}
          </>
        )}

        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          name="password"
          type="password"
          value={values.password}
          onChange={change}
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 12 : undefined}
          maxLength={128}
          disabled={working}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password
              ? "auth-password-help auth-password-error"
              : "auth-password-help"
          }
        />
        <small id="auth-password-help">
          {isRegister
            ? "Use 12–128 characters. Spaces are welcome."
            : "Enter the password for your SafeBite account."}
        </small>
        {errors.password && (
          <p className="auth-dialog__field-error" id="auth-password-error">
            {errors.password}
          </p>
        )}

        <button
          className="auth-dialog__submit"
          type="submit"
          disabled={working}
        >
          {working ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>
      <p className="auth-dialog__switch">
        {isRegister ? "Already have an account? " : "New to SafeBite? "}
        <button
          type="button"
          disabled={working}
          onClick={() => openAuth(isRegister ? "login" : "register")}
        >
          {isRegister ? "Sign in" : "Create an account"}
        </button>
      </p>
    </dialog>
  );
}

AuthDialog.propTypes = {};
export default AuthDialog;
