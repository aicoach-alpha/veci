import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const source = readFileSync(new URL('../veci/js/pages/cellular.js', import.meta.url), 'utf8');
test('SMS mode is explicitly fail-closed and read-only-aware', () => {
	assert.match(source, /smsMode = 'unavailable'/);
	assert.match(source, /\['receive_only', 'full'\]\.includes\(settings\.mode\)/);
	assert.match(source, /smsComposeOpen\.remove\(\)/);
	assert.match(source, /smsSentOpen\.remove\(\)/);
	assert.match(source, /smsDraftOpen\.remove\(\)/);
	assert.match(source, /SMS backend unavailable or not authorized/);
});
test('CSP-safe local SMS stylesheet is packaged', () => {
	assert.equal(existsSync(new URL('../veci/sms-center.css', import.meta.url)), true);
	const css = readFileSync(new URL('../veci/sms-center.css', import.meta.url), 'utf8');
	assert.match(css, /sms-message-card/);
});

test('read-only controls remain hidden despite main button CSS', () => {
	const css = readFileSync(new URL('../veci/sms-center.css', import.meta.url), 'utf8');
	for (const selector of [
		'#cellular-sms-compose-open[hidden]',
		'#cellular-sms-sent-open[hidden]',
		'#cellular-sms-drafts-open[hidden]'
	])
		assert.ok(css.includes(selector));
	assert.match(css, /display:\s*none/);
	assert.match(source, /Unsupported SMS backend mode/);
});

test('unsupported actions are physically removed and cache-busted', () => {
	for (const name of ['smsComposeOpen', 'smsSentOpen', 'smsDraftOpen']) {
		assert.ok(source.includes(name + '.remove()'), name);
	}
	assert.match(source, /sms-center\.css\?v=160/);
	const app = readFileSync(new URL('../veci/js/app.js', import.meta.url), 'utf8');
	const index = readFileSync(new URL('../veci/index.html', import.meta.url), 'utf8');
	assert.match(app, /pages\/cellular\.js\?v=160/);
	assert.match(index, /js\/app\.js\?v=160/);
});
