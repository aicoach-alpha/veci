// The native openNDS voucher ThemeSpec expects exactly seven CSV columns.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function secureCode(randomBytes) {
	let out = '';
	while (out.length < 9) {
		const values = randomBytes(16);
		if (!values || values.length < 1) throw new Error('Secure randomness unavailable');
		for (const v of values) {
			if (v < Math.floor(256 / ALPHABET.length) * ALPHABET.length) {
				out += ALPHABET[v % ALPHABET.length];
				if (out.length === 9) break;
			}
		}
	}
	return out;
}
function validInteger(value, min, max, label) {
	if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(label + ' out of range');
	return value;
}
export function generateVoucherCsv(
	config,
	randomBytes = length => {
		if (!globalThis.crypto?.getRandomValues) throw new Error('Secure randomness is unavailable');
		return globalThis.crypto.getRandomValues(new Uint8Array(length));
	}
) {
	const count = validInteger(config.count, 1, 100, 'Voucher count');
	const duration = validInteger(config.minutes, 1, 43200, 'Duration');
	const down = validInteger(config.downloadKbps, 0, 100000, 'Download rate');
	const up = validInteger(config.uploadKbps, 0, 100000, 'Upload rate');
	const quotaDown = validInteger(config.downloadKiB, 0, 104857600, 'Download quota');
	const quotaUp = validInteger(config.uploadKiB, 0, 104857600, 'Upload quota');
	const seen = new Set();
	const rows = [];
	for (let i = 0; i < count; i++) {
		let code;
		do {
			code = secureCode(randomBytes);
		} while (seen.has(code));
		seen.add(code);
		// code, download kb/s, upload kb/s, download KiB, upload KiB, minutes, unused marker
		rows.push([code, down, up, quotaDown, quotaUp, duration, 0].join(','));
	}
	return rows.join('\n') + '\n';
}
