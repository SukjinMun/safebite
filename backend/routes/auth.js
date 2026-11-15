import { Router } from "express";
import passport from "../auth/passport.js";
import { createUser, publicUser } from "../db/users.js";
import { csrfToken, requireCsrf } from "../middleware/csrf.js";
import { limitAuthAttempts } from "../middleware/authAttempts.js";
import { validateAuthInput } from "../validation/auth.js";

const router = Router();
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/session", (req, res) => {
  res.json({ user: publicUser(req.user), csrfToken: csrfToken(req) });
});

function validate(register) {
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      return res
        .status(409)
        .json({ error: "Sign out before using another account." });
    }
    const { value, errors } = validateAuthInput(req.body, { register });
    if (!value)
      return res
        .status(400)
        .json({ error: "Check the account fields.", errors });
    req.body = value;
    return next();
  };
}

function finishLogin(req, res, next, user, status) {
  // Passport regenerates the session ID before saving the authenticated user.
  req.login(user, (error) => {
    if (error) return next(error);
    const token = csrfToken(req);
    req.session.save((saveError) => {
      if (saveError) return next(saveError);
      return res
        .status(status)
        .json({ user: publicUser(req.user), csrfToken: token });
    });
  });
}

router.post(
  "/register",
  requireCsrf,
  limitAuthAttempts,
  validate(true),
  async (req, res, next) => {
    try {
      const user = await createUser(req.body);
      return finishLogin(req, res, next, user, 201);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          error: "That username is already taken.",
          errors: { username: "Choose another username." },
        });
      }
      return next(error);
    }
  },
);

router.post(
  "/login",
  requireCsrf,
  limitAuthAttempts,
  validate(false),
  (req, res, next) => {
    passport.authenticate("local", (error, user) => {
      if (error) return next(error);
      if (!user)
        return res
          .status(401)
          .json({ error: "Username or password is incorrect." });
      return finishLogin(req, res, next, user, 200);
    })(req, res, next);
  },
);

router.post("/logout", requireCsrf, (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.session.destroy((destroyError) => {
      if (destroyError) return next(destroyError);
      res.clearCookie("safebite.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return res.status(204).end();
    });
  });
});

export default router;
