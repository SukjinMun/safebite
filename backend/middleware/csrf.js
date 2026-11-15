import { randomBytes, timingSafeEqual } from "node:crypto";

export function csrfToken(req) {
  if (!req.session.csrfToken)
    req.session.csrfToken = randomBytes(32).toString("hex");
  return req.session.csrfToken;
}

export function requireCsrf(req, res, next) {
  const supplied = req.get("X-CSRF-Token");
  const expected = req.session?.csrfToken;
  if (
    typeof supplied !== "string" ||
    !/^[a-f0-9]{64}$/.test(supplied) ||
    typeof expected !== "string" ||
    !/^[a-f0-9]{64}$/.test(expected) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  ) {
    return res
      .status(403)
      .json({ error: "Your session changed. Please try again." });
  }
  return next();
}
