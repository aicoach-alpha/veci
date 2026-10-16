import test from 'node:test';
import assert from 'node:assert/strict';
import { bindFirmwareUpdates } from '../veci/js/lib/firmware-updates.js';

function fixture(overrides = {}, allow = false) {
  const ids = ['fw-status','fw-ota-status','fw-file','fw-sha','fw-upload','fw-check','fw-download','fw-apply'];
  const nodes = Object.fromEntries(ids.map(id => [id, {
    textContent: '', hidden: false, disabled: false, value: '', files: [],
    handlers: Object.create(null),
    addEventListener(name, handler) { this.handlers[name] = handler; }
  }]));
  const calls = [];
  const api = { async veci(method, params) {
    calls.push({ method, params });
    if (method === 'firmwareStatus') return { board: 'zbtlink,zbt-we5927', max_bytes: 7808 * 1024, signature_policy: 'required' };
    if (Object.hasOwn(overrides, method)) return overrides[method];
    throw Error('unexpected method ' + method);
  }};
  const root = { querySelector(selector) { return nodes[selector.slice(1)] || null; } };
  return { nodes, api, root, calls, toast() {}, confirm: async () => allow };
}

test('no published OTA image does not allow download or flash', async () => {
  const f = fixture({ firmwareRemoteCheck: { ok: true, available: false } });
  await bindFirmwareUpdates(f);
  await f.nodes['fw-check'].handlers.click();
  assert.match(f.nodes['fw-ota-status'].textContent, /No OTA/);
  assert.equal(f.nodes['fw-download'].disabled, true);
  assert.equal(f.nodes['fw-apply'].hidden, true);
  assert.equal(f.calls.some(x => x.method === 'firmwareApply'), false);
});

test('unsigned OTA image is always blocked even after sysupgrade validation', async () => {
  const sha = 'a'.repeat(64);
  const f = fixture({
    firmwareRemoteCheck: { ok: true, available: true, compatible: true, update_available: true, sha256: sha, version: '2026.10' },
    firmwareRemoteDownload: { ok: true, sha256: sha },
    firmwareValidate: { ok: true, validated: true, signature_verified: false, apply_token: 'b'.repeat(64) }
  }, true);
  await bindFirmwareUpdates(f);
  await f.nodes['fw-check'].handlers.click();
  assert.equal(f.nodes['fw-download'].disabled, false);
  await f.nodes['fw-download'].handlers.click();
  assert.equal(f.nodes['fw-apply'].hidden, true);
  assert.equal(f.calls.some(x => x.method === 'firmwareApply'), false);
});

test('signed image requires explicit final confirmation before firmwareApply', async () => {
  const sha = 'a'.repeat(64);
  const config = {
    firmwareRemoteCheck: { ok: true, available: true, compatible: true, update_available: true, sha256: sha },
    firmwareRemoteDownload: { ok: true, sha256: sha },
    firmwareValidate: { ok: true, validated: true, signature_verified: true, apply_token: 'b'.repeat(64) },
    firmwareApply: { ok: true }
  };
  const denied = fixture(config, false);
  await bindFirmwareUpdates(denied);
  await denied.nodes['fw-check'].handlers.click();
  await denied.nodes['fw-download'].handlers.click();
  assert.equal(denied.nodes['fw-apply'].hidden, true);
  assert.equal(denied.calls.some(x => x.method === 'firmwareApply'), false);
  const approved = fixture(config, true);
  await bindFirmwareUpdates(approved);
  await approved.nodes['fw-check'].handlers.click();
  await approved.nodes['fw-download'].handlers.click();
  assert.equal(approved.nodes['fw-apply'].hidden, false);
  await approved.nodes['fw-apply'].handlers.click();
  const flashes = approved.calls.filter(x => x.method === 'firmwareApply');
  assert.equal(flashes.length, 1);
  assert.equal(flashes[0].params.keep_settings, true);
  assert.equal(approved.nodes['fw-apply'].hidden, true);
});

test('manual firmware refuses unsigned source and missing checksum', async () => {
  const f = fixture();
  await bindFirmwareUpdates(f);
  f.nodes['fw-file'].files = [{ name: 'sysupgrade.bin', size: 1024 }];
  await f.nodes['fw-upload'].handlers.click();
  assert.match(f.nodes['fw-status'].textContent, /publisher SHA-256/);
  assert.equal(f.calls.some(x => x.method === 'firmwareUploadStart'), false);
});

test('missing firmware service disables actions', async () => {
  const f = fixture();
  f.api.veci = async () => { throw Error('method_not_found'); };
  await bindFirmwareUpdates(f);
  assert.equal(f.nodes['fw-upload'].disabled, true);
  assert.equal(f.nodes['fw-check'].disabled, true);
  assert.equal(f.nodes['fw-apply'].hidden, true);
});


test('board-native unsigned release blocks generic firmware download', async () => {
  const f = fixture({ firmwareRemoteCheck: {
    ok: true, available: true, compatible: true, update_available: true, sha256: 'a'.repeat(64)
  } }, true);
  await bindFirmwareUpdates({
    ...f,
    nativeFirmwareCheck: async () => ({ ok: true, state: 'unverified_release' })
  });
  await f.nodes['fw-check'].handlers.click();
  assert.match(f.nodes['fw-ota-status'].textContent, /not verified/);
  assert.equal(f.nodes['fw-download'].disabled, true);
  assert.equal(f.calls.some(x => x.method === 'firmwareRemoteCheck'), false);
});
