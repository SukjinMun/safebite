import { Passport } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { findUserById, findUserForLogin } from "../db/users.js";
import { verifyPassword } from "./passwords.js";

const passport = new Passport();

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await findUserForLogin(username.trim().toLowerCase());
      const valid = await verifyPassword(password, user?.passwordHash);
      if (!user || !valid) return done(null, false);
      return done(null, {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
      });
    } catch (error) {
      return done(error);
    }
  }),
);

passport.serializeUser((user, done) => done(null, user._id.toHexString()));
passport.deserializeUser(async (id, done) => {
  try {
    return done(null, (await findUserById(id)) || false);
  } catch (error) {
    return done(error);
  }
});

export default passport;
