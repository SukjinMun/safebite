import { ObjectId } from "mongodb";
import { db } from "./connection.js";
import { hashPassword } from "../auth/passwords.js";

const users = db.collection("users");
const PUBLIC_FIELDS = { username: 1, displayName: 1 };

export function ensureUserIndexes() {
  return users.createIndex({ username: 1 }, { unique: true });
}

export function publicUser(user) {
  return user
    ? {
        id: user._id.toHexString(),
        username: user.username,
        displayName: user.displayName,
      }
    : null;
}

export function findUserForLogin(username) {
  return users.findOne({ username });
}

export function findUserById(id) {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) return null;
  return users.findOne(
    { _id: new ObjectId(id) },
    { projection: PUBLIC_FIELDS },
  );
}

export async function createUser({ username, displayName, password }) {
  const user = {
    username,
    displayName,
    passwordHash: await hashPassword(password),
    createdAt: new Date(),
  };
  const { insertedId } = await users.insertOne(user);
  return { _id: insertedId, username, displayName };
}
