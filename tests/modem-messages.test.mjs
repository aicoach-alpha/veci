import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSmsTextList, decodeUssdUcs2 } from '../veci/js/lib/modem-messages.js';

test('SMS text-mode fixture parses without modem access', () => {
	const input = [
		'+CMGL: 1,"REC UNREAD","+6281234567890","","26/10/12,10:20:11+28"',
		'Your code is 123456',
		'+CMGL: 2,"REC READ","+628111111","","26/10/12,10:21:11+28"',
		'Hello there',
		'OK'
	].join('\r\n');
	const rows = parseSmsTextList(input);
	assert.equal(rows.length, 2);
	assert.equal(rows[0].index, 1);
	assert.equal(rows[0].status, 'REC UNREAD');
	assert.equal(rows[0].text, 'Your code is 123456');
	assert.equal(rows[1].text, 'Hello there');
});

test('unknown AT output does not become an SMS', () => {
	assert.deepEqual(parseSmsTextList('AT+CMGF=?\r\n+CMGF: (0,1)\r\nOK'), []);
	assert.deepEqual(parseSmsTextList('+CUSD: 0,"00410042",72'), []);
	assert.deepEqual(parseSmsTextList(null), []);
});

test('oversized raw input and overly long SMS are rejected', () => {
	assert.deepEqual(parseSmsTextList('x'.repeat(32769)), []);
	const longSms = '+CMGL: 0,"REC READ","+628123","","26/10/12"\n' + 'x'.repeat(1030);
	assert.deepEqual(parseSmsTextList(longSms), []);
});

test('SMS fields cannot inject a second header or executable markup', () => {
	const r = parseSmsTextList('+CMGL: 0,"REC READ","+62812","","26/10/12"\n<script>alert(1)</script>\nOK');
	assert.equal(r[0].text, '<script>alert(1)</script>');
	// Renderers must use textContent/escapeHtml; parser intentionally does not HTML-render.
});

test('UCS2 USSD decoding is bounded and requires recognized DCS', () => {
	assert.equal(decodeUssdUcs2('0053006900730061', 72), 'Sisa');
	assert.equal(decodeUssdUcs2('00530069', 0), null);
	assert.equal(decodeUssdUcs2('ZZZZ', 72), null);
	assert.equal(decodeUssdUcs2('D800', 72), null);
	assert.equal(decodeUssdUcs2('A'.repeat(2052), 72), null);
});
