import test from 'node:test';
import assert from 'node:assert/strict';
import { quotaSummary } from '../veci/js/lib/quota.js';

const baseline = {
	schema: 1,
	provider: 'xl',
	state: 'ready',
	source: 'carrier_authenticated',
	remaining_bytes: 4 * 1024 ** 3,
	total_bytes: 10 * 1024 ** 3,
	buckets: [
		{ id: 'main', remaining_bytes: 4 * 1024 ** 3 },
		{ id: 'local', remaining_bytes: 5 * 1024 ** 3 }
	]
};

test('authenticated XL quota displays only reported aggregate', () => {
	const result = quotaSummary(baseline);
	assert.equal(result.provider, 'XL');
	assert.equal(result.primary, '4.00 GiB');
	assert.match(result.detail, /of 10.00 GiB/);
	assert.doesNotMatch(result.detail, /9\.00/); // overlapping buckets are never summed
});

test('unconnected provider never invents a quota', () => {
	const result = quotaSummary({
		schema: 1,
		provider: 'xl',
		state: 'not_connected',
		remaining_bytes: 999
	});
	assert.equal(result.primary, 'Not connected');
});

test('backend values cannot impersonate verified carrier results', () => {
	for (const source of [undefined, null, 'router_traffic', 'cached_guess', '']) {
		assert.equal(quotaSummary({ ...baseline, source }).primary, 'Unavailable');
	}
});

test('unknown or unsafe numbers never appear as quota', () => {
	for (const remaining_bytes of [null, -1, 1.5, '123', Number.NaN, Number.MAX_SAFE_INTEGER + 2]) {
		assert.equal(quotaSummary({ ...baseline, remaining_bytes }).primary, 'Unavailable');
	}
});

test('stale reading remains clearly labeled', () => {
	const result = quotaSummary({ ...baseline, state: 'stale' });
	assert.equal(result.stale, true);
	assert.match(result.detail, /stale/);
});

test('unsupported and malformed operators are not rendered', () => {
	assert.equal(quotaSummary({ ...baseline, provider: '<script>' }), null);
	assert.equal(quotaSummary({ ...baseline, schema: 2 }), null);
	assert.equal(quotaSummary({ ...baseline, state: 'malformed' }), null);
	assert.equal(quotaSummary(null), null);
});

test('non-ready auth states never reveal prior cached numeric totals', () => {
	for (const state of ['unauthorized', 'otp_required', 'unavailable']) {
		const result = quotaSummary({ ...baseline, state });
		assert.doesNotMatch(result.primary, /GiB/);
	}
});
