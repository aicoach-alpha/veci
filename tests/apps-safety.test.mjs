import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const script = readFileSync(new URL('../files/rpcd-veci', import.meta.url), 'utf8');
test('Router Apps check resources and reject unsafe packages', () => {
	for (const part of [
		'app_resources_ok()',
		'MemAvailable:',
		'2048',
		'8192',
		'safe_package_words()',
		'kernel-*',
		'kmod-*',
		'insufficient_router_resources'
	])
		assert.ok(script.includes(part), part);
});
test('package changes require successful APK simulation', () => {
	assert.match(script, /apk --simulate add --repositories-file/);
	assert.match(script, /apk --simulate del/);
	assert.match(script, /core_dependency_protected/);
});

test('package allowlist blocks option injection, paths and core packages at runtime', () => {
	const func = script.match(/safe_package_words\(\) \{[\s\S]*?\n\}/)?.[0];
	assert.ok(func, 'function must be extractable');
	for (const [candidate, expected] of [
		['opennds', 0],
		['--force', 1],
		['kmod-usb-core', 1],
		['a/b', 1],
		['base-files', 1],
		['veci-app-voucher', 0]
	]) {
		const rc = spawnSync('sh', ['-c', func + '\n' + 'safe_package_words "$1"', 'sh', candidate]).status;
		assert.equal(rc, expected, candidate);
	}
});

test('cannot remove guest portal while voucher application depends on it', () => {
	assert.match(script, /voucher_depends_on_guest/);
	assert.match(script, /package_installed veci-app-voucher/);
});

test('APK simulation parser protects core packages without blocking optional apps', () => {
	const func = script.match(/app_removal_has_core_packages\(\) \{[\s\S]*?\n\}/)?.[0];
	assert.ok(func, 'missing core package parser');
	for (const [pkg, blocked] of [
		['veci-app-voucher', false],
		['veci-app-guest', false],
		['veci-app-sqm', false],
		['uspot', false],
		['veci', true],
		['veci-default-ui', true],
		['rpcd', true],
		['dnsmasq-full', true],
		['kernel-6.12.94', true],
		['kmod-usb-core', true]
	]) {
		const result = spawnSync('sh', ['-c', func + '\napp_removal_has_core_packages /dev/stdin'], {
			input: '(1/1) Purging ' + pkg + ' (1-r1)\nOK: 21 MiB in 80 packages\n',
			encoding: 'utf8'
		});
		assert.equal(result.status, blocked ? 0 : 1, pkg + ' ' + result.stderr);
	}
});
