import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypescript } from './helpers/load-typescript.mjs';

const { hostedBootstrapRole, registerIdentity } = await import(await loadTypescript(new URL('../lib/server/bootstrap.ts', import.meta.url)));
const { initialState } = await import(await loadTypescript(new URL('../lib/server/seed.ts', import.meta.url)));

test('hosted bootstrap defaults to customers and only explicit distinct allowlists grant authority', () => {
  assert.equal(hostedBootstrapRole('visitor@example.test', {}), 'customer');
  const config = { HQ_ADMIN_EMAILS: 'admin@example.test', FATIMA_BOOTSTRAP_CEO_EMAILS: 'executive@example.test', FATIMA_BOOTSTRAP_OPERATIONS_DIRECTOR_EMAILS: 'operations@example.test' };
  assert.equal(hostedBootstrapRole(' ADMIN@example.test ', config), 'administrator');
  assert.equal(hostedBootstrapRole('executive@example.test', config), 'ceo');
  assert.equal(hostedBootstrapRole('operations@example.test', config), 'operations-director');
  assert.equal(hostedBootstrapRole('executive@example.test.attacker.test', config), 'customer');
  assert.throws(() => hostedBootstrapRole('admin@example.test', { ...config, FATIMA_BOOTSTRAP_CEO_EMAILS: 'admin@example.test' }), /conflicting roles/);
});

test('initial authority can be provisioned once for an existing customer and cannot undo later demotion', () => {
  const identity = { id: 'sites:executive', email: 'executive@example.test', name: 'Approved test executive', role: 'ceo', unitId: 'HQ' };
  const previous = initialState();
  previous.users.push({ ...identity, role: 'customer', unitId: 'BR-DEMO-01' });
  const grant = registerIdentity(previous, identity);
  assert.equal(previous.users[0].role, 'customer');
  assert.equal(grant.result.role, 'ceo');
  assert.equal(grant.state.audit[0].action, 'account.bootstrap');
  assert.equal(grant.state.audit[0].target, identity.id);
  grant.state.users[0].role = 'customer';
  grant.state.users[0].unitId = 'BR-DEMO-01';
  const repeat = registerIdentity(grant.state, identity);
  assert.equal(repeat.result.role, 'customer');
  assert.equal(repeat.state, grant.state);
});

test('normal sign-in preserves approved persisted roles and local personas never bootstrap hosted authority', () => {
  const previous = initialState();
  const identity = { id: 'sites:staff', email: 'staff@example.test', name: 'Sample employee', role: 'customer', unitId: 'BR-DEMO-01' };
  previous.users.push({ ...identity, role: 'finance', unitId: 'HQ' });
  assert.equal(registerIdentity(previous, identity).result.role, 'finance');
  const local = registerIdentity(initialState(), { ...identity, id: 'local-executive', role: 'ceo', unitId: 'HQ', localDemo: true });
  assert.equal(local.state.audit[0].action, 'account.identity');
});
