export function validateAuthInput(body, { register = false } = {}) {
  const errors = {};
  const input =
    body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const username =
    typeof input.username === "string"
      ? input.username.trim().toLowerCase()
      : "";
  const displayName =
    typeof input.displayName === "string" ? input.displayName.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    errors.username = "Use 3–30 letters, numbers, underscores, or hyphens.";
  }
  if (
    !password ||
    password.length > 128 ||
    (register && password.length < 12)
  ) {
    errors.password = register
      ? "Use a password with 12–128 characters."
      : "Enter your password (up to 128 characters).";
  }
  if (register && (displayName.length < 2 || displayName.length > 60)) {
    errors.displayName = "Use a display name with 2–60 characters.";
  }
  return Object.keys(errors).length
    ? { errors, value: null }
    : {
        errors: {},
        value: { username, password, ...(register ? { displayName } : {}) },
      };
}
