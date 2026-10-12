// A presentation-only adapter. This module never requests OTPs, makes network
// calls or sums package buckets (which can overlap across operators).
const PROVIDER_LABELS = Object.freeze({
	xl: 'XL',
	axis: 'AXIS',
	smartfren: 'Smartfren',
	telkomsel: 'Telkomsel',
	byu: 'by.U',
	im3: 'IM3',
	tri: 'Tri',
	orbit: 'Telkomsel Orbit'
});

const STATES = new Set(['not_connected', 'otp_required', 'ready', 'stale', 'unauthorized', 'unavailable']);

function validBytes(value) {
	return Number.isSafeInteger(value) && value >= 0;
}

function showBytes(value) {
	if (!validBytes(value)) return '—';
	if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GiB`;
	return `${(value / 1024 ** 2).toFixed(1)} MiB`;
}

export function quotaSummary(payload) {
	if (!payload || payload.schema !== 1 || !Object.hasOwn(PROVIDER_LABELS, payload.provider)) return null;
	if (!STATES.has(payload.state)) return null;

	const provider = PROVIDER_LABELS[payload.provider];
	if (payload.state === 'not_connected') {
		return { provider, primary: 'Not connected', detail: 'Carrier login is not configured', stale: false };
	}
	if (payload.state === 'otp_required' || payload.state === 'unauthorized') {
		return {
			provider,
			primary: 'Sign-in required',
			detail: 'Authenticate with your mobile operator',
			stale: false
		};
	}
	if (payload.state === 'unavailable') {
		return { provider, primary: 'Unavailable', detail: 'Carrier quota could not be retrieved', stale: false };
	}

	// Only an authenticated carrier result may be displayed as numeric quota.
	// Traffic counters and unsigned imported totals are not authoritative.
	if (payload.source !== 'carrier_authenticated' || !validBytes(payload.remaining_bytes)) {
		return { provider, primary: 'Unavailable', detail: 'Verified carrier quota not available', stale: false };
	}
	const total =
		validBytes(payload.total_bytes) && payload.total_bytes >= payload.remaining_bytes
			? ` of ${showBytes(payload.total_bytes)}`
			: '';
	return {
		provider,
		primary: showBytes(payload.remaining_bytes),
		detail: `Remaining${total}${payload.state === 'stale' ? ' · Last result (stale)' : ' · Operator reported'}`,
		stale: payload.state === 'stale'
	};
}
