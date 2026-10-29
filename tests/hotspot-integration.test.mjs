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
