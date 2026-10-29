import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const read = filename => readFileSync(new URL('../' + filename, import.meta.url), 'utf8');
test('System and kernel logs are bounded, opt-in, read-only RPC methods', () => {
	const source = read('files/rpcd-veci');
	const acl = JSON.parse(read('rpcd-acl.json'));
	const ui = read('veci/js/pages/system.js');
	assert.match(source, /method_logs\(\) \{/);
	assert.match(source, /logs\) method_logs/);
	assert.match(source, /\[ "\$limit" -gt 150 \]/);
	assert.match(source, /cut -c1-240 \| tail -c 16000/);
	assert.ok(acl.veci.read.ubus.veci.includes('logs'));
	assert.ok(!acl.veci.write.ubus.veci.includes('logs'));
	assert.match(ui, /id="refresh-logs"/);
	assert.match(ui, /data-log-source="kernel"/);
	assert.match(ui, /logOutput\.textContent = result\.output/);
	assert.doesNotMatch(ui.split('const logOutput =')[0], /veci\('logs'/);
	assert.match(ui, /const result = await api\.veci\('logs'/);
});
test('log endpoint rejects unbounded selectors before command invocation', () => {
	const backend = read('files/rpcd-veci');
	const func = backend.match(/^method_logs\(\) \{[\s\S]*?^\}/m)?.[0];
	assert.ok(func);
	assert.match(func, /case "\$source" in system\|kernel/);
	assert.match(func, /limit=100/);
	assert.match(func, /\[ "\$limit" -lt 20 \]/);
});

test('log runtime clamps source, count and response bytes without opening router services', () => {
	const script = read('files/rpcd-veci');
	const method = script.match(/^method_logs\(\) \{[\s\S]*?^\}/m)?.[0];
	assert.ok(method);
	const runnable = method.replace(/\. \/usr\/share\/libubox\/jshn\.sh/, ':');
	const mocks = `
    jsonfilter() { case "$*" in *"@.source"*) printf '%s' "$MOCK_SOURCE";; *"@.limit"*) printf '%s' "$MOCK_LIMIT";; esac; }
    logread() { awk 'BEGIN{ for(i=0;i<230;i++) {printf "%04d ",i; for(j=0;j<400;j++)printf "x"; printf "\\n"} }'; }
    dmesg() { logread; }
    json_init() { :; }
    json_add_string() { case "$1" in source) printf "SOURCE=%s\\n" "$2" >&2;; output) printf '%s' "$2";; esac; }
    json_add_int() { [ "$1" != limit ] || printf "LIMIT=%s\\n" "$2" >&2; }
    json_dump() { :; }
  `;
	for (const [source, limit, wantedSource, wantedLimit] of [
		['unexpected;reboot', '99999', 'system', 150],
		['kernel', '0', 'kernel', 20],
		['system', 'abc', 'system', 100]
	]) {
		const result = spawnSync('sh', ['-c', mocks + '\n' + runnable + '\nprintf "{}" | method_logs'], {
			env: { ...process.env, MOCK_SOURCE: source, MOCK_LIMIT: limit },
			encoding: 'utf8',
			timeout: 5000
		});
		assert.equal(result.status, 0, result.stderr);
		assert.ok(result.stdout.length <= 16000, 'output exceeded response cap');
		assert.match(result.stderr, new RegExp('SOURCE=' + wantedSource));
		assert.match(result.stderr, new RegExp('LIMIT=' + wantedLimit));
	}
});
