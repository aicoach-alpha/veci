import test from 'node:test';
import assert from 'node:assert/strict';
import { menuOwner, routeTarget, primaryNavigation } from '../veci/js/lib/menu-policy.js';

test('OTA has one menu owner (System) and IPv6 belongs to Network', () => {
	for (const value of ['ota', 'firmware', 'update', 'updates']) {
		assert.equal(routeTarget(value), 'updates');
		assert.equal(menuOwner(value), 'system');
	}
	assert.equal(routeTarget('ipv6'), 'network');
	assert.equal(menuOwner('ipv6'), 'network');
	assert.equal(menuOwner('hotspot'), 'apps');
	assert.equal(menuOwner('devices'), 'network');
});

test('deep-linked advanced pages stay out of the primary navigation', () => {
	const pages = [
		{ id: 'home' }, { id: 'network' }, { id: 'system' }, { id: 'updates' },
		{ id: 'hotspot' }, { id: 'devices' }, { id: 'wifi' }, { id: 'internet' },
		{ id: 'apps' }, { id: 'cellular' }, { id: 'security' }
	];
	assert.deepEqual(
		primaryNavigation(pages).map(page => page.id),
		['home', 'network', 'system', 'wifi', 'internet', 'apps', 'cellular', 'security']
	);
});

test('optional capability-gated entries and duplicates are omitted', () => {
	assert.deepEqual(
		primaryNavigation([{ id: 'home' }, { id: 'apps', capability: 'apps' }, { id: 'home' }], { apps: false }).map(page => page.id),
		['home']
	);
});
