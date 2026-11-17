import { getReportAuthorId } from "./reportAuth.js";

// require a signed-in user and expose their ID to the route
export function requireUser(req, res, next) {
  const userId = getReportAuthorId(req);

  if (!userId) {
    return res.status(401).json({ error: "Log in to use your grocery list." });
  }

  res.locals.userId = userId;
  return next();
}