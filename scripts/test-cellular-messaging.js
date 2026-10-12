import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { smsStorageLabel, smsFeaturesLabel, ussdCapabilityLabel } from '../veci/js/lib/messaging.js';

const good = { ok: true, source: 'read_only_at_cpms', memory: 'ME', used: 5, total: 255 };
assert.equal(smsStorageLabel(good), '5 / 255 (ME)');
for (const entry of [
	{ ...good, used: '5' },
	{ ...good, total: '255' },
	{ ...good, used: -1 },
	{ ...good, used: 256 },
	{ ...good, total: 0 },
	{ ...good, total: 999999 },
	{ ...good, memory: '<script>' },
	{ ...good, memory: '\n' },
	{ ...good, memory: 'ME";alert(1)' },
	{ ...good, ok: false },
	{ ...good, source: 'other' },
	{},
	{ ...good, used: NaN },
	{ ...good, total: Infinity }
])
	assert.equal(smsStorageLabel(entry), 'Unavailable');
const capabilities = {
	ok: true,
	source: 'read_only_at_test',
	sms_mode: 'supported',
	sms_storage: 'supported',
	sms_notifications: 'supported',
	ussd: 'supported'
};
assert.equal(smsFeaturesLabel(capabilities), 'Supported');
assert.equal(ussdCapabilityLabel(capabilities), 'Supported (test only)');
assert.equal(smsFeaturesLabel({ ...capabilities, sms_notifications: 'unknown' }), 'Unavailable');
assert.equal(ussdCapabilityLabel({ ...capabilities, ussd: 'unknown' }), 'Unavailable');
assert.equal(ussdCapabilityLabel({ ...capabilities, source: 'other' }), 'Unavailable');

const api = readFileSync(new URL('../veci/js/lib/api.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../veci/js/pages/cellular.js', import.meta.url), 'utf8');
const safePanel = ui.match(/id="cellular-check-messaging"/g) || [];
assert.equal(safePanel.length, 1);
assert.match(ui, /checkMessaging\?\.addEventListener\('click'/);
assert.match(ui, /Promise\.allSettled/);
assert.match(ui, /smsStorageLabel/);
assert.match(ui, /smsFeaturesLabel/);
assert.match(ui, /ussdCapabilityLabel/);
assert.match(ui, /SMS Inbox is not enabled yet/);
assert.match(api, /this\.call\('veci\.cellular', 'messagingStorage', \{\}\)/);
assert.match(api, /this\.call\('veci\.cellular', 'messagingCapabilities', \{\}\)/);

// Privacy regression: neither UI nor RPC API may dispatch inbox listing,
// arbitrary AT commands, SMS content retrieval or USSD sessions.
for (const forbidden of [
	'CMGL',
	'CMGR',
	'CUSD',
	'sendSms',
	'readSms',
	'ussdExecute',
	'innerHTML = storage',
	'innerHTML = capabilities'
]) {
	assert.equal(ui.includes(forbidden) || api.includes(forbidden), false, forbidden);
}
console.log('CELLULAR_MESSAGING_METADATA_UI_PASS');
