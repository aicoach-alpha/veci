import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => readFileSync(new URL('../veci/js/pages/' + name, import.meta.url), 'utf8');
test('Hotspot uses native guest and voucher RPC providers', () => {
	const hotspot = read('hotspot.js');
	assert.match(hotspot, /veci\.app\.guest/);
	assert.match(hotspot, /veci\.app\.voucher/);
	assert.match(hotspot, /\/veci-apps\/guest\.js/);
	assert.match(hotspot, /\/veci-apps\/voucher\.js/);
	assert.doesNotMatch(hotspot, /openNDS|voucher CSV|voucher roll/i);
});

test('guest client visibility and disconnect require authenticated ACL', () => {
	const acl = JSON.parse(readFileSync(new URL('../rpcd-acl.json', import.meta.url), 'utf8'));
	assert.ok(acl.veci.read.ubus['veci.app.*'].includes('clients'));
	assert.ok(acl.veci.write.ubus['veci.app.*'].includes('disconnect'));
});

test('Hotspot voucher batch is bounded and authorized', () => {
	const hotspot = read('hotspot.js');
	const acl = JSON.parse(readFileSync(new URL('../rpcd-acl.json', import.meta.url), 'utf8'));
	assert.ok(acl.veci.write.ubus['veci.app.*'].includes('createBatch'));
	assert.match(hotspot, /count\s*<\s*1\s*\|\|\s*count\s*>\s*20/);
	assert.match(hotspot, /'createBatch'/);
	assert.match(hotspot, /result\?\.ok !== true/);
	assert.match(hotspot, /URL\.revokeObjectURL/);
});
