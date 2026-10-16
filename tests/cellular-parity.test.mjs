import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const cellular = readFileSync(new URL('../veci/js/pages/cellular.js', import.meta.url), 'utf8');

test('SMS v1.6.0 feature parity is present in Cellular without USSD', () => {
  assert.doesNotMatch(cellular, /ussd/i);
  for (const method of ['getConfig','setEnabled','listMessages','deleteMessage','sendMessage','getSent','getDrafts','saveDraft','deleteDraft']) {
    assert.ok(cellular.includes(method), 'missing SMS method: ' + method);
  }
  for (const term of ['buildSmsSubmitSegments', 'decodePrivatePdu', 'mergeSmsParts', 'cellular-sms-enabled', 'cellular-sms-open', 'cellular-sms-messages']) {
    assert.ok(cellular.includes(term), 'missing message feature: ' + term);
  }
});

test('Carrier quota panel does not auto-authenticate or invent quota', () => {
  assert.ok(cellular.includes("api.call('veci.quota', 'status'"));
  assert.ok(cellular.includes('quotaSummary(carrierQuota)'));
  assert.ok(cellular.includes('Operator Data Quota'));
  assert.ok(cellular.includes('no automatic login') || cellular.includes('No automatic login'));
  assert.doesNotMatch(cellular, /api\.call\(['"]veci\.xl['"],\s*['"](?:requestOtp|submitOtp|refresh)/i);
});
