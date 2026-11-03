import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const source = readFileSync(new URL('../veci/js/pages/cellular.js', import.meta.url), 'utf8');
test('SMS mode is explicitly fail-closed and read-only-aware', () => {
	assert.match(source, /smsMode = 'unavailable'/);
	assert.match(source, /settings\.mode === 'receive_only'/);
	assert.match(source, /smsComposeOpen\.hidden = true/);
	assert.match(source, /smsSentOpen\.hidden = true/);
	assert.match(source, /smsDraftOpen\.hidden = true/);
	assert.match(source, /SMS backend unavailable or not authorized/);
});
test('CSP-safe local SMS stylesheet is packaged', () => {
	assert.equal(existsSync(new URL('../veci/sms-center.css', import.meta.url)), true);
	const css = readFileSync(new URL('../veci/sms-center.css', import.meta.url), 'utf8');
	assert.match(css, /sms-message-card/);
});
