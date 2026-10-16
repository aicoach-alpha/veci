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

test('native XL operator remaining-only quota is shown when evidence is fresh', () => {
  const result = quotaSummary({
    schema: 1, provider: 'xl', state: 'ok', source: 'operator',
    quality: 'remaining_only', fetched_at: new Date().toISOString(),
    buckets: [{ label: 'XL Internet', remaining_bytes: 1610612736 }]
  });
  assert.equal(result.primary, '1.50 GiB');
  assert.equal(result.buckets.length, 1);
  assert.equal(Object.hasOwn(result.buckets[0], 'total'), false);
});

test('separate operator packages are never added into an invented total', () => {
  const result = quotaSummary({
    schema: 1, provider: 'xl', state: 'ok', source: 'operator',
    fetched_at: new Date().toISOString(),
    buckets: [
      { label: 'Main', remaining_bytes: 3 * 1024 ** 3 },
      { label: 'Local', remaining_bytes: 4 * 1024 ** 3 }
    ]
  });
  assert.equal(result.primary, '2 verified packages');
  assert.equal(result.buckets[0].remaining, '3.00 GiB');
  assert.equal(result.buckets[1].remaining, '4.00 GiB');
  assert.doesNotMatch(result.primary, /7\.00/);
});

test('native operator data fails closed for missing or stale evidence', () => {
  const x = { schema:1, provider:'xl', state:'ok', source:'operator',
    fetched_at:new Date().toISOString(), buckets:[{label:'Main',remaining_bytes:100}] };
  for (const change of [
    {source:'router_traffic'}, {source:undefined}, {fetched_at:null},
    {fetched_at:new Date(Date.now() - 3600000).toISOString()},
    {buckets:[{label:'Main',remaining_bytes:-3}]},
    {buckets:[{label:'Main',remaining_bytes:100,total_bytes:20}]}
  ]) {
    const result = quotaSummary({...x,...change});
    assert.ok(result === null || result.primary === 'Unavailable');
  }
});

test('native quota rejects future timestamps and excessive bucket counts', () => {
  const basic = {
    schema:1, provider:'xl', state:'ok', source:'operator',
    fetched_at:new Date().toISOString(),
    buckets:[{label:'Main',remaining_bytes:1024}]
  };
  const future = quotaSummary({...basic,fetched_at:new Date(Date.now()+300000).toISOString()});
  const excess = quotaSummary({...basic,buckets:Array.from({length:65},(_,i)=>({label:'bucket'+i,remaining_bytes:100}))});
  assert.equal(future.primary,'Unavailable');
  assert.equal(excess.primary,'Unavailable');
});
