// Read-only SMS diagnostics presentation; never render modem-supplied markup.
// Values are deliberately reduced to a tiny fixed metadata allowlist.
export function smsStorageLabel(result) {
	if (result?.ok !== true || result.source !== 'read_only_at_cpms') return 'Unavailable';
	const { used, total, memory } = result;
	if (
		!Number.isSafeInteger(used) ||
		!Number.isSafeInteger(total) ||
		used < 0 ||
		total < 1 ||
		total > 65535 ||
		used > total ||
		typeof memory !== 'string' ||
		!/^[A-Z]{2}$/.test(memory)
	) return 'Unavailable';
	return `${used} / ${total} (${memory})`;
}

export function smsFeaturesLabel(result) {
	if (result?.ok !== true || result.source !== 'read_only_at_test') return 'Unavailable';
	return ['sms_mode', 'sms_storage', 'sms_notifications'].every(key => result[key] === 'supported')
		? 'Supported'
		: 'Unavailable';
}

export function ussdCapabilityLabel(result) {
	return result?.ok === true && result.source === 'read_only_at_test' && result.ussd === 'supported'
		? 'Supported (test only)'
		: 'Unavailable';
}
