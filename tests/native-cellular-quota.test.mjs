import test from 'node:test';
import assert from 'node:assert/strict';
import cellularPage from '../veci/js/pages/cellular.js';

const signedResult = {
	schema: 1, provider: 'xl', state: 'ready', source: 'carrier_authenticated',
	remaining_bytes: 5 * 1024 ** 3, total_bytes: 10 * 1024 ** 3
};

async function simulate(result, unavailable = false) {
	const calls = [];
	const events = new Map();
	const fields = new Map();
	const root = {
		innerHTML: '',
		querySelector(selector) {
			if (selector === '#cellular-quota-refresh') {
				if (!this.innerHTML.includes('id="cellular-quota-refresh"')) return null;
				if (!fields.has(selector)) fields.set(selector, {
					dataset: {}, disabled: false, textContent: 'Refresh local quota status',
					addEventListener(type, listener) { events.set(type, listener); }
				});
				return fields.get(selector);
			}
			if (selector === '#cellular-quota-primary' || selector === '#cellular-quota-detail') {
				if (!this.innerHTML.includes(selector.slice(1))) return null;
				if (!fields.has(selector)) fields.set(selector, { textContent: '' });
				return fields.get(selector);
			}
			return null;
		}
	};
	const api = {
		async cellularStatus() {
			return { online: false, sim: 1, operator: 'XL', model: 'Test modem' };
		},
		async call(object, method, params, opts) {
			calls.push({ object, method, params, opts });
			if (unavailable) throw Error('rpcd object unavailable');
			assert.equal(object, 'veci.quota');
			assert.equal(method, 'status');
			return typeof result === 'function' ? result(calls.length) : result;
		}
	};
	const notices = [];
	await cellularPage.render({ api, root, toast: (...v) => notices.push(v), confirm: async () => false });
	return { root, calls, events, fields, notices };
}

test('native Cellular quota is opt-in and does not affect General edition', async () => {
	const view = await simulate(null, true);
	assert.doesNotMatch(view.root.innerHTML, /id="cellular-quota-panel"/);
	assert.match(view.root.innerHTML, /id="cellular-messaging-panel"/);
	assert.match(view.root.innerHTML, /id="cellular-reconnect"/);
	assert.equal(view.calls.length, 1);
	assert.equal(view.calls[0].object, 'veci.quota');
});

test('not connected displays honest status within native Cellular', async () => {
	const view = await simulate({ schema: 1, provider: 'xl', state: 'not_connected' });
	assert.match(view.root.innerHTML, /id="cellular-quota-panel"/);
	assert.match(view.root.innerHTML, /XL data quota/);
	assert.match(view.root.innerHTML, /Not connected/);
	assert.doesNotMatch(view.root.innerHTML, /5.00 GiB/);
	assert.equal(view.calls.length, 1);
});

test('numbers only shown for carrier-authenticated source', async () => {
	const a = await simulate(signedResult);
	assert.match(a.root.innerHTML, /5.00 GiB/);
	const b = await simulate({ ...signedResult, source: 'router_traffic' });
	assert.match(b.root.innerHTML, /Unavailable/);
	assert.doesNotMatch(b.root.innerHTML, /5.00 GiB/);
});

test('invalid provider names cannot inject HTML', async () => {
	const bad = await simulate({ ...signedResult, provider: '<script>alert(1)</script>' });
	assert.doesNotMatch(bad.root.innerHTML, /cellular-quota-panel/);
});

test('local refresh only reads quota status; never invokes OTP or SMS actions', async () => {
	let response = 0;
	const view = await simulate(() => response++ === 0
		? { schema: 1, provider: 'xl', state: 'not_connected' }
		: signedResult);
	const fn = view.events.get('click');
	assert.equal(typeof fn, 'function');
	await fn();
	assert.equal(view.calls.length, 2);
	assert.deepEqual(view.calls.map(x => x.object + '.' + x.method), ['veci.quota.status', 'veci.quota.status']);
	assert.equal(view.fields.get('#cellular-quota-primary').textContent, '5.00 GiB');
	assert.match(view.fields.get('#cellular-quota-detail').textContent, /Operator reported/);
});
