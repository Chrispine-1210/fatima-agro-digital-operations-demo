/** Offline developer tool. Input through a pipe; no browser provisioning endpoint exists. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { hashPassword, normalizeUsername, validUsername } = await import(pathToFileURL(resolve('lib/server/password-crypto.ts')));
const input = JSON.parse(readFileSync(0, 'utf8'));
const roles = ['customer','sales','storekeeper','procurement','finance','finance-director','hr','hr-director','operations-director','branch-manager','administrator','communications','ceo'];
if (!['create','rotate','disable','assign'].includes(input.operation) || typeof input.directive !== 'string' || input.directive.length < 10 || input.directive.length > 300) throw new Error('Supply a recorded CEO directive and a supported operation.');
const username = normalizeUsername(input.username);
if (!validUsername(username)) throw new Error('Supply a valid Fatima username.');
if (input.operation !== 'create' && !/^[A-Za-z0-9:_-]{8,100}$/.test(input.accountId ?? '')) throw new Error('Supply the exact existing account ID.');
if (['create','assign'].includes(input.operation) && (!roles.includes(input.role) || typeof input.unitId !== 'string')) throw new Error('Supply an approved role and active unit ID.');
if (input.operation === 'create' && (typeof input.name !== 'string' || input.name.length < 3 || input.name.length > 100)) throw new Error('Supply the account display name.');
const operation = { id: `DIRECTIVE-${randomUUID()}`, directive: input.directive, operation: input.operation, accountId: input.operation === 'create' ? `fatima:${randomUUID()}` : input.accountId, username };
if (['create','assign'].includes(input.operation)) { operation.role = input.role; operation.unitId = input.unitId; }
if (input.operation === 'create') operation.name = input.name;
let issued;
if (['create','rotate'].includes(input.operation)) {
  if (typeof input.pepper !== 'string' || input.pepper.length < 43) throw new Error('Supply the protected server pepper through stdin.');
  issued = randomBytes(18).toString('base64url'); operation.password = await hashPassword(issued, input.pepper);
}
mkdirSync('private', { recursive: true });
const packetPath = resolve('private', `${operation.id}.json`);
writeFileSync(packetPath, JSON.stringify([operation], null, 2), { mode: 0o600, flag: 'wx' });
if (issued) writeFileSync(resolve('private', `${operation.id}-issued-password.txt`), `Username: ${username}\nPassword: ${issued}\nAccount: ${operation.accountId}\nDirective: ${input.directive}\n`, { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ prepared: true, operation: input.operation, accountId: operation.accountId, packetPath, passwordPrinted: false, instruction: 'Review the directive, protect the local private files, set a secret FATIMA_ACCOUNT_BATCH binding to the packet, then deploy. Never commit or publicly host these files.' }));
