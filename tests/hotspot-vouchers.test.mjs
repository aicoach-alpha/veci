import test from 'node:test';
import assert from 'node:assert/strict';
import { generateVoucherCsv } from '../veci/js/lib/voucher.js';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
test('openNDS voucher roll has 7 columns, 9-character unique codes and correct limits', () => {
	const csv = generateVoucherCsv(
		{ count: 50, minutes: 120, downloadKbps: 2000, uploadKbps: 1000, downloadKiB: 2048, uploadKiB: 0 },
		randomBytes
	);
	const lines = csv.trim().split('\n');
	assert.equal(lines.length, 50);
	assert.equal(new Set(lines.map(line => line.split(',')[0])).size, 50);
	for (const line of lines) {
		const columns = line.split(',');
		assert.equal(columns.length, 7);
		assert.match(columns[0], /^[A-Z2-9]{9}$/);
		assert.deepEqual(columns.slice(1), ['2000', '1000', '2048', '0', '120', '0']);
	}
});
test('out-of-range voucher values fail before any export', () => {
	const randomBytes = n => new Uint8Array(n);
	assert.throws(
		() =>
			generateVoucherCsv(
				{ count: 101, minutes: 60, downloadKbps: 0, uploadKbps: 0, downloadKiB: 0, uploadKiB: 0 },
				randomBytes
			),
		RangeError
	);
	assert.throws(
		() =>
			generateVoucherCsv(
				{ count: 1, minutes: -1, downloadKbps: 0, uploadKbps: 0, downloadKiB: 0, uploadKiB: 0 },
				randomBytes
			),
		RangeError
	);
});

test('hotspot status has authenticated read-only RPC access', () => {
	const script = readFileSync(new URL('../files/rpcd-veci', import.meta.url), 'utf8');
	assert.ok(script.includes('method_hotspot_status()'));
	assert.ok(script.includes('voucher_theme_configured'));
	const acl = JSON.parse(readFileSync(new URL('../rpcd-acl.json', import.meta.url), 'utf8'));
	assert.ok(acl.veci.read.ubus.veci.includes('hotspotStatus'));
});
