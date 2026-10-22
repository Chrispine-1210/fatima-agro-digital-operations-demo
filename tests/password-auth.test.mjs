import test from "node:test";
import assert from "node:assert/strict";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const cryptoAuth = await import(await loadTypescript(new URL("../lib/server/password-crypto.ts", import.meta.url)));
const { capabilities, canPerform } = await import(await loadTypescript(new URL("../lib/server/permissions.ts", import.meta.url)));
const { initialState, localPersonas } = await import(await loadTypescript(new URL("../lib/server/seed.ts", import.meta.url)));
const { applyAction, snapshot } = await import(await loadTypescript(new URL("../lib/server/domain.ts", import.meta.url)));
const { hashPassword, verifyPassword, randomToken, hashSessionToken, validSession, SESSION_LIFETIME, validPassword, validPasswordHash, safeReturnPath, normalizeUsername, validUsername } = cryptoAuth;

test("password hashes use unique random salts and a separately required server pepper", async () => {
  const secret = randomToken(), pass = randomToken(), first = await hashPassword(pass, secret), second = await hashPassword(pass, secret);
  assert.notEqual(first.salt, second.salt); assert.notEqual(first.digest, second.digest); assert.equal(validPasswordHash(first), true);
  assert.equal(first.iterations, 100000); assert.notEqual(first.digest, pass);
  const account = { accountId: "fatima:test", username: "fatima.test", password: first, version: 1, enabled: true };
  assert.equal(await verifyPassword(pass, account, secret), true);
  assert.equal(await verifyPassword(pass + "x", account, secret), false);
  assert.equal(await verifyPassword(pass, account, randomToken()), false);
  assert.equal(await verifyPassword(pass, null, secret), false);
  assert.equal(await verifyPassword(pass, { ...account, enabled: false }, secret), false);
  await assert.rejects(hashPassword(pass, "short"), /configuration/);
});
test("password bounds preserve whitespace and case while rejecting malformed hashes and unbounded inputs", async () => {
  const pepper = randomToken(), pass = ` ${randomToken()} `;
  const password = await hashPassword(pass, pepper), account = { accountId: "fatima:test", username: "fatima.test", password, version: 1, enabled: true };
  assert.equal(await verifyPassword(pass, account, pepper), true);
  assert.equal(await verifyPassword(pass.trim(), account, pepper), false);
  for (const value of [null, undefined, {}, "short", "x".repeat(129)]) assert.equal(validPassword(value), false);
  assert.equal(validPassword("x".repeat(64)), true);
  for (const value of [{ ...password, iterations: 1 }, { ...password, salt: "bad" }, { ...password, digest: "bad" }, { ...password, algorithm: "SHA256" }]) assert.equal(validPasswordHash(value), false);
  assert.equal(await verifyPassword({}, account, pepper), false);
});
test("sessions are opaque random tokens and only their hashes are stored", async () => {
  const a = randomToken(), b = randomToken(); assert.notEqual(a, b); assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  const hash = await hashSessionToken(a); assert.notEqual(hash, a); assert.match(hash, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(await hashSessionToken(a), hash); assert.notEqual(await hashSessionToken(b), hash);
});
test("session policy rejects expired, revoked, disabled, future and rotated credentials", () => {
  const now = Date.now(), createdAt = new Date(now - 1000).toISOString();
  const session = { accountId: "fatima:test", tokenHash: "hash", credentialVersion: 4, createdAt, expiresAt: new Date(now + SESSION_LIFETIME - 1000).toISOString() };
  const credential = { accountId: session.accountId, version: 4, enabled: true };
  assert.equal(validSession(session, credential, undefined, now), true);
  assert.equal(validSession(session, credential, new Date(now - 2000).toISOString(), now), true);
  for (const revoke of [createdAt, new Date(now).toISOString(), "invalid"]) assert.equal(validSession(session, credential, revoke, now), false);
  assert.equal(validSession(session, { ...credential, version: 5 }, undefined, now), false);
  assert.equal(validSession(session, { ...credential, enabled: false }, undefined, now), false);
  assert.equal(validSession(session, { ...credential, accountId: "different" }, undefined, now), false);
  assert.equal(validSession({ ...session, expiresAt: createdAt }, credential, undefined, now), false);
  assert.equal(validSession({ ...session, createdAt: new Date(now + 1).toISOString() }, credential, undefined, now), false);
  assert.equal(validSession({ ...session, expiresAt: new Date(now + SESSION_LIFETIME + 1).toISOString() }, credential, undefined, now), false);
});
test("usernames and return paths cannot inject provider redirects or arbitrary origins", () => {
  assert.equal(normalizeUsername(" FATIMA.FINANCE "), "fatima.finance"); assert.equal(validUsername("fatima.finance"), true);
  for (const username of ["a", "<script>", "fatima@example.com", "x".repeat(65), "fatima/ceo"]) assert.equal(validUsername(username), false);
  for (const value of ["https://attacker.invalid", "//attacker.invalid", "/\\attacker.invalid", "/signin-with-chatgpt", "/api/portal", {}, "x".repeat(301)]) assert.equal(safeReturnPath(value), "/account");
  assert.equal(safeReturnPath("/hq/executive"), "/hq/executive"); assert.equal(safeReturnPath("/products/demo-maize?review=1"), "/products/demo-maize?review=1");
});
test("managed Fatima accounts cannot self-register, reset or grant portal roles, including by direct action", () => {
  const state = initialState(); state.users = Object.values(localPersonas).map(user => ({ ...user, managedAccount: true }));
  for (const user of state.users) {
    for (const action of ["customer.register", "admin.roleRequest", "admin.roleDecision", "admin.applyRole", "admin.reset"]) {
      assert.equal(capabilities(user).includes(action), false, `${user.role} ${action}`); assert.equal(canPerform(user, action), false);
      assert.throws(() => applyAction(state, user, action, {}), /approved role/);
    }
  }
  const finance = state.users.find(user => user.role === "finance"), ceo = state.users.find(user => user.role === "ceo");
  assert.equal(capabilities(finance).includes("finance.payment"), true); assert.equal(capabilities(ceo).includes("executive.decisionCreate"), true);
  assert.throws(() => snapshot(state, finance, "executive"), /approved role/);
  assert.throws(() => snapshot(state, ceo, "hr"), /approved role/);
  assert.equal(JSON.stringify(snapshot(state, ceo, "executive")).includes("password"), false);
});
