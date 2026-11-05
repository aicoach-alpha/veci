import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const home = readFileSync(new URL('../veci/js/pages/home.js', import.meta.url), 'utf8');
test('performance-first home shows grounded, optional monitor statuses', () => {
	assert.match(home, /performanceStatus/);
	assert.match(home, /local_tmpfs_monitors/);
	assert.match(home, /LTE Recovery/);
	assert.match(home, /Wi-Fi Guardian/);
	assert.match(home, /Not monitored/);
	assert.doesNotMatch(home, /99\.9% uptime|500 Mbps|ultra-fast/);
});
test('performance release forces fresh JS modules', () => {
	const app = readFileSync(new URL('../veci/js/app.js', import.meta.url), 'utf8');
	const index = readFileSync(new URL('../veci/index.html', import.meta.url), 'utf8');
	assert.match(app, /home\.js\?v=161/);
	assert.match(index, /app\.js\?v=161/);
});
