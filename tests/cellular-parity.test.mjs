import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const cellular = readFileSync(new URL('../veci/js/pages/cellular.js', import.meta.url), 'utf8');

test('SMS v1.6.0 feature parity is present in Cellular without USSD', () => {
	assert.doesNotMatch(cellular, /ussd/i);
	for (const method of [
		'getConfig',
		'setEnabled',
		'listMessages',
		'deleteMessage',
		'sendMessage',
		'getSent',
		'getDrafts',
		'saveDraft',
		'deleteDraft'
	]) {
		assert.ok(cellular.includes(method), 'missing SMS method: ' + method);
	}
	for (const term of [
		'buildSmsSubmitSegments',
		'decodePrivatePdu',
		'mergeSmsParts',
		'cellular-sms-enabled',
		'cellular-sms-open',
		'cellular-sms-messages'
	]) {
		assert.ok(cellular.includes(term), 'missing message feature: ' + term);
	}
});

test('VeCI General keeps SMS but removes country-specific quota UI', () => {
	assert.doesNotMatch(
		cellular,
		/Operator Data Quota|veci\.quota|quotaSummary|carrier-quota|myXL|XL ACCOUNT|INDONESIA/i
	);
	const home = readFileSync(new URL('../veci/js/pages/home.js', import.meta.url), 'utf8');
	assert.doesNotMatch(home, /veci\.quota|carrier-quota|quotaSummary/);
});
