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
		['base-files', 1]
	]) {
		const rc = spawnSync('sh', ['-c', func + '\n' + 'safe_package_words "$1"', 'sh', candidate]).status;
		assert.equal(rc, expected, candidate);
	}
});
