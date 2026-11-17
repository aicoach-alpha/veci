import test from 'node:test';
import assert from 'node:assert/strict';
import { wifiRuntimeState } from '../veci/js/pages/wifi.js';

test('enabled configuration without AP runtime never claims broadcast', () => {
	assert.deepEqual(wifiRuntimeState({ disabled: '0' }, { disabled: '0' }, null), {
		label: 'AP unavailable',
		tone: 'warning'
	});
});

test('radio0 up without runtime iface remains unavailable', () => {
	assert.equal(wifiRuntimeState({}, {}, { radio: { up: true } }).label, 'AP unavailable');
});

test('radio0 down is unavailable despite an iface entry', () => {
	assert.equal(
		wifiRuntimeState({}, {}, { radio: { up: false }, iface: { section: 'default_radio0' } }).label,
		'AP unavailable'
	);
});

test('live netifd configuration does not prove visible beacon', () => {
	const state = wifiRuntimeState({}, {}, {
		radio: { up: true },
		iface: { section: 'default_radio0' }
	});
	assert.equal(state.label, 'AP configured · beacon unverified');
	assert.notEqual(state.tone, 'success');
});

test('explicit radio or AP disable is reflected correctly', () => {
	assert.equal(wifiRuntimeState({ disabled: '1' }, {}, null).label, 'Disabled');
	assert.equal(wifiRuntimeState({}, { disabled: '1' }, null).label, 'Disabled');
	assert.equal(wifiRuntimeState({ disabled: 1 }, {}, null).label, 'Disabled');
});
