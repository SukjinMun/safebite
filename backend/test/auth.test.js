import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { MongoClient } from "mongodb";
import { hashPassword, verifyPassword } from "../auth/passwords.js";
import { validateAuthInput } from "../validation/auth.js";

test("Account validation and salted password verification", async () => {
  const good = {
    username: "Demo_User",
    displayName: "Demo Visitor",
    password: "fictional test passphrase",
  };
  assert.equal(
    validateAuthInput(good, { register: true }).value.username,
    "demo_user",
  );
  assert.equal(validateAuthInput(null, { register: true }).value, null);
  assert.ok(
    validateAuthInput({ ...good, password: "short" }, { register: true }).errors
      .password,
  );
  assert.ok(
    validateAuthInput({ ...good, username: { $ne: null } }).errors.username,
  );
  assert.ok(
    validateAuthInput({ ...good, displayName: " " }, { register: true }).errors
      .displayName,
  );
  const first = await hashPassword(good.password);
  const second = await hashPassword(good.password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(good.password, first), true);
  assert.equal(await verifyPassword("incorrect passphrase", first), false);
  assert.equal(await verifyPassword(good.password, undefined), false);
});

class BrowserSession {
  constructor(base) {
    this.base = base;
    this.cookies = new Map();
  }

  get cookie() {
    return [...this.cookies]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  async request(path, { method = "GET", body, token, csrf = true } = {}) {
    if (method !== "GET" && csrf && !token) {
      token = (await this.request("/api/auth/session")).data.csrfToken;
    }
    const response = await fetch(this.base + path, {
      method,
      headers: {
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "X-CSRF-Token": token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10000),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const split = pair.indexOf("=");
      const name = pair.slice(0, split);
      const value = pair.slice(split + 1);
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
    const data = response.status === 204 ? null : await response.json();
    return { status: response.status, data, headers: response.headers };
  }
}

test(
  "Passport sessions and two-account report ownership over HTTP",
  { timeout: 90000 },
  async (t) => {
    // The database name is generated here; the application's MONGODB_DB is never used.
    const databaseName = `safebite_auth_test_${randomBytes(8).toString("hex")}`;
    assert.match(databaseName, /^safebite_auth_test_[a-f\d]{16}$/);
    const client = new MongoClient(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
      { serverSelectionTimeoutMS: 5000 },
    );
    const db = client.db(databaseName);
    const probe = createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const secret = randomBytes(32).toString("hex");
    let server;
    let connected = false;

    async function stopServer() {
      if (!server || server.exitCode !== null || server.signalCode !== null)
        return;
      const stopped = once(server, "exit");
      server.kill("SIGTERM");
      await stopped;
    }

    async function startServer() {
      server = spawn(process.execPath, ["server.js"], {
        cwd: new URL("../", import.meta.url),
        env: {
          ...process.env,
          MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
          MONGODB_DB: databaseName,
          SESSION_SECRET: secret,
          PORT: String(port),
          NODE_ENV: "test",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      await new Promise((resolve, reject) => {
        let output = "";
        const timer = setTimeout(
          () => reject(new Error(`Server did not start: ${output}`)),
          15000,
        );
        const consume = (chunk) => {
          output += chunk;
          if (output.includes(`Server running on port ${port}`)) {
            clearTimeout(timer);
            resolve();
          }
        };
        server.stdout.on("data", consume);
        server.stderr.on("data", consume);
        server.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        server.once("exit", (code) => {
          clearTimeout(timer);
          reject(new Error(`Server exited (${code}): ${output}`));
        });
      });
    }

    try {
      await client.connect();
      connected = true;
      const inspections = JSON.parse(
        await readFile(
          new URL("../seed/inspections.generated.json", import.meta.url),
          "utf8",
        ),
      );
      await db.collection("inspections").insertMany(inspections);
      await startServer();

      const base = `http://127.0.0.1:${port}`;
      const alice = new BrowserSession(base);
      const bob = new BrowserSession(base);
      const visitor = new BrowserSession(base);
      const path = "/api/restaurants/demo-rest-001/reports";
      const password = "fictional test passphrase";
      let aliceId, bobId, reportId, bobReportId, oldCookie;

      await t.test(
        "Public pages and existing restaurant APIs stay accessible",
        async () => {
          for (const page of ["/", "/recalls", "/restaurants"]) {
            assert.equal((await fetch(base + page)).status, 200);
          }
          const list = await visitor.request("/api/restaurants?pageSize=2");
          assert.equal(list.status, 200);
          assert.equal(list.data.total, 200);
          assert.equal(list.data.summary.inspectionCount, 1000);
          assert.equal(
            (await visitor.request("/api/restaurants/demo-rest-001")).data
              .inspections.length,
            5,
          );
          assert.equal(
            (await visitor.request("/api/recalls?pageSize=2")).status,
            200,
          );
          assert.equal((await visitor.request(path)).data.currentUserId, null);
        },
      );

      await t.test("Anonymous report writes remain unauthorized", async () => {
        for (const [method, target] of [
          ["POST", path],
          ["PUT", "/api/reports/000000000000000000000000"],
          ["DELETE", "/api/reports/000000000000000000000000"],
        ]) {
          assert.equal(
            (await visitor.request(target, { method, csrf: false })).status,
            401,
          );
        }
      });

      await t.test(
        "Sign-up requires a CSRF token and valid account fields",
        async () => {
          assert.equal(
            (
              await visitor.request("/api/auth/register", {
                method: "POST",
                body: {},
                csrf: false,
              })
            ).status,
            403,
          );
          const invalid = await visitor.request("/api/auth/register", {
            method: "POST",
            body: { username: "a", displayName: "A", password: "short" },
          });
          assert.equal(invalid.status, 400);
          assert.ok(invalid.data.errors.password);
        },
      );

      await t.test(
        "Registration signs in, rotates the cookie, and returns only public fields",
        async () => {
          await alice.request("/api/auth/session");
          const anonymousCookie = alice.cookie;
          const result = await alice.request("/api/auth/register", {
            method: "POST",
            body: { username: "Alice", displayName: "Demo Alice", password },
          });
          assert.equal(result.status, 201);
          aliceId = result.data.user.id;
          assert.match(aliceId, /^[a-f\d]{24}$/);
          assert.notEqual(alice.cookie, anonymousCookie);
          assert.deepEqual(Object.keys(result.data.user).sort(), [
            "displayName",
            "id",
            "username",
          ]);
          assert.match(result.headers.getSetCookie().join(";"), /HttpOnly/i);
          assert.match(
            result.headers.getSetCookie().join(";"),
            /SameSite=Lax/i,
          );
          const stored = await db
            .collection("users")
            .findOne({ username: "alice" });
          assert.match(stored.passwordHash, /^scrypt-v1\$/);
          assert.ok(!JSON.stringify(stored).includes(password));
          assert.ok(
            await db
              .collection("sessions")
              .findOne({ expiresAt: { $gt: new Date() } }),
          );
        },
      );

      await t.test(
        "The signed-in session survives a backend restart",
        async () => {
          await stopServer();
          await startServer();
          assert.equal(
            (await alice.request("/api/auth/session")).data.user.id,
            aliceId,
          );
        },
      );

      await t.test("A second account has an independent identity", async () => {
        const result = await bob.request("/api/auth/register", {
          method: "POST",
          body: { username: "bob", displayName: "Demo Bob", password },
        });
        assert.equal(result.status, 201);
        bobId = result.data.user.id;
        assert.notEqual(bobId, aliceId);
        assert.equal(
          (await alice.request("/api/auth/session")).data.user.id,
          aliceId,
        );
      });

      await t.test(
        "Report authorship comes from Passport, including the public display name",
        async () => {
          const forged = await alice.request(path, {
            method: "POST",
            body: {
              visitDate: "2026-01-02",
              description: "Synthetic observation for an integration test.",
              authorId: bobId,
              authorName: "Forged name",
            },
          });
          assert.equal(forged.status, 400);
          const result = await alice.request(path, {
            method: "POST",
            body: {
              visitDate: "2026-01-02",
              description: "Synthetic observation for an integration test.",
            },
          });
          assert.equal(result.status, 201);
          reportId = result.data.report._id;
          assert.equal(result.data.report.authorId, aliceId);
          assert.equal(result.data.report.authorName, "Demo Alice");
          const publicRead = await visitor.request(path);
          assert.equal(publicRead.status, 200);
          assert.equal(publicRead.data.reports[0].authorName, "Demo Alice");
          assert.equal(publicRead.data.currentUserId, null);
        },
      );

      await t.test(
        "Another account cannot edit or delete the first account's report",
        async () => {
          assert.equal(
            (
              await bob.request(`/api/reports/${reportId}`, {
                method: "PUT",
                body: {
                  visitDate: "2026-01-02",
                  description: "Attempted unauthorized edit",
                },
              })
            ).status,
            404,
          );
          assert.equal(
            (
              await bob.request(`/api/reports/${reportId}`, {
                method: "DELETE",
              })
            ).status,
            404,
          );
          assert.equal(
            (await visitor.request(path)).data.reports[0].authorId,
            aliceId,
          );
        },
      );

      await t.test(
        "Each account can create and update its own report",
        async () => {
          const own = await bob.request(path, {
            method: "POST",
            body: {
              visitDate: "2026-01-02",
              description: "A second synthetic observation.",
            },
          });
          assert.equal(own.status, 201);
          bobReportId = own.data.report._id;
          const updated = await alice.request(`/api/reports/${reportId}`, {
            method: "PUT",
            body: {
              visitDate: "2026-01-03",
              description: "Updated synthetic observation.",
            },
          });
          assert.equal(updated.status, 200);
          assert.equal(updated.data.report.authorId, aliceId);
          assert.equal(
            updated.data.report.description,
            "Updated synthetic observation.",
          );
        },
      );

      await t.test(
        "Signed-in writes reject missing/invalid CSRF tokens and invalid report fields",
        async () => {
          const options = {
            method: "PUT",
            body: { visitDate: "2026-01-02", description: "Test" },
          };
          assert.equal(
            (
              await alice.request(`/api/reports/${reportId}`, {
                ...options,
                csrf: false,
              })
            ).status,
            403,
          );
          assert.equal(
            (
              await alice.request(`/api/reports/${reportId}`, {
                ...options,
                token: "0".repeat(64),
              })
            ).status,
            403,
          );
          const invalid = await alice.request(`/api/reports/${reportId}`, {
            method: "PUT",
            body: { visitDate: "not-a-date", description: " " },
          });
          assert.equal(invalid.status, 400);
          assert.ok(invalid.data.errors.visitDate);
        },
      );

      await t.test(
        "Logout clears authentication and invalidates the old cookie",
        async () => {
          oldCookie = alice.cookies.get("safebite.sid");
          assert.equal(
            (await alice.request("/api/auth/logout", { method: "POST" }))
              .status,
            204,
          );
          assert.equal(alice.cookies.has("safebite.sid"), false);
          const replay = new BrowserSession(base);
          replay.cookies.set("safebite.sid", oldCookie);
          assert.equal(
            (await replay.request("/api/auth/session")).data.user,
            null,
          );
          assert.equal(
            (await alice.request(path, { method: "POST", body: {} })).status,
            401,
          );
        },
      );

      await t.test(
        "Bad credentials are rejected, and valid credentials restore the same account",
        async () => {
          for (const username of ["alice", "unknown-user"]) {
            const result = await alice.request("/api/auth/login", {
              method: "POST",
              body: { username, password: "incorrect passphrase" },
            });
            assert.equal(result.status, 401);
            assert.equal(
              result.data.error,
              "Username or password is incorrect.",
            );
          }
          const result = await alice.request("/api/auth/login", {
            method: "POST",
            body: { username: "ALICE", password },
          });
          assert.equal(result.status, 200);
          assert.equal(result.data.user.id, aliceId);
        },
      );

      await t.test(
        "Case-insensitive duplicate usernames are rejected",
        async () => {
          const duplicate = await visitor.request("/api/auth/register", {
            method: "POST",
            body: { username: "ALICE", displayName: "Another Alice", password },
          });
          assert.equal(duplicate.status, 409);
          assert.ok(duplicate.data.errors.username);
        },
      );

      await t.test(
        "Owners can delete their reports without affecting other authors",
        async () => {
          assert.equal(
            (
              await alice.request(`/api/reports/${reportId}`, {
                method: "DELETE",
              })
            ).status,
            204,
          );
          const remaining = (await bob.request(path)).data.reports;
          assert.equal(remaining.length, 1);
          assert.equal(remaining[0]._id, bobReportId);
          assert.equal(
            (
              await bob.request(`/api/reports/${bobReportId}`, {
                method: "DELETE",
              })
            ).status,
            204,
          );
          assert.equal((await visitor.request(path)).data.reports.length, 0);
        },
      );

      await t.test(
        "Expired sessions are denied before MongoDB's TTL cleanup runs",
        async () => {
          const signed = decodeURIComponent(alice.cookies.get("safebite.sid"));
          const sid = signed.slice(2, signed.lastIndexOf("."));
          const id = createHash("sha256").update(sid).digest("hex");
          assert.equal(
            (
              await db
                .collection("sessions")
                .updateOne({ _id: id }, { $set: { expiresAt: new Date(0) } })
            ).matchedCount,
            1,
          );
          assert.equal(
            (await alice.request("/api/auth/session")).data.user,
            null,
          );
          const indexes = await db.collection("sessions").indexes();
          assert.ok(indexes.some((index) => index.expireAfterSeconds === 0));
        },
      );

      await t.test("Repeated authentication attempts are bounded", async () => {
        let result;
        for (let i = 0; i < 35; i += 1) {
          result = await visitor.request("/api/auth/login", {
            method: "POST",
            body: { username: "bad", password: "" },
          });
          if (result.status === 429) break;
        }
        assert.equal(result.status, 429);
        assert.ok(Number(result.headers.get("retry-after")) > 0);
      });
    } finally {
      await stopServer();
      // Only this run's newly generated test database is removed.
      try {
        if (connected) await db.dropDatabase();
      } finally {
        await client.close();
      }
    }
  },
);
