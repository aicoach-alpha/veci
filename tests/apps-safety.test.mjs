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

test('App catalog suppresses Guest removal when Voucher is installed', () => {
	assert.match(script, /\[ "\$id" = guest \] && package_installed veci-app-voucher/);
	const listMethod = script.split('method_apps() {')[1].split('\nmethod_app_action() {')[0];
	assert.match(listMethod, /removable=false/);
});

test('Router Apps refuses optimistic install if signed-feed provider is missing', () => {
	const ui = readFileSync(new URL('../veci/js/pages/apps.js', import.meta.url), 'utf8');
	assert.match(ui, /state\.deviceApps\?\.feed_ready === true/);
	assert.match(ui, /state\.deviceApps\?\.feed_verified === true/);
	assert.doesNotMatch(ui, /state\.deviceApps === null \|\| state\.deviceApps\.feed_ready/);
	assert.match(ui, /Signed-feed verification provider veci.apps is not installed/);
	assert.match(ui, /guest: \['Guest portal'/);
	assert.doesNotMatch(ui, /opennds: \['Guest portal'/);
});

test('Core app catalog returns bounded overlay and memory metrics when feed provider is missing', () => {
	const core = readFileSync(new URL('../files/rpcd-veci', import.meta.url), 'utf8');
	const ui = readFileSync(new URL('../veci/js/pages/apps.js', import.meta.url), 'utf8');
	const section = core.split('method_apps() {')[1].split('\nmethod_app_action() {')[0];
	for (const field of ['overlay_free_kb', 'minimum_overlay_kb', 'memory_available_kb', 'minimum_mem_available_kb'])
		assert.match(section, new RegExp(field));
	assert.match(core, /overlay_free_kb=null/);
	assert.match(core, /mem_available_kb=null/);
	assert.match(ui, /Number\.isFinite\(state\.deviceApps\?\.overlay_free_kb\) \? state\.deviceApps : state\.catalog/);
	assert.match(ui, /resources\.overlay_free_kb/);
	assert.match(ui, /resources\.minimum_overlay_kb/);
});



test('Router Apps resource guard preserves fail-closed runtime checks', () => {
  const body = script.split('app_resources_ok() {')[1]?.split('\n}\n\nsafe_package_words()')[0];
  assert.ok(body, 'resource guard must be present');
  for (const expected of [
    'df -Pk /overlay',
    "case \"$free_kb\" in",
    '[ "$free_kb" -ge 2048 ]',
    'MemAvailable:',
    "case \"$mem_kb\" in",
    '[ "$mem_kb" -ge 8192 ]'
  ]) assert.ok(body.includes(expected), expected);
  assert.doesNotMatch(body, /printf '\\{ "package_manager"/);
});
