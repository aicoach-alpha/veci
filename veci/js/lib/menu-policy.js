// Canonical navigation for the firmware-pinned VeCI source.
// Deep links remain functional; only one primary menu owns each feature.
export const PRIMARY_ROUTES = Object.freeze([
	'home',
	'internet',
	'wifi',
	'cellular',
	'network',
	'security',
	'system',
	'apps'
]);

const ROUTE_ALIAS = Object.freeze({
	ota: 'updates',
	update: 'updates',
	firmware: 'updates',
	ipv6: 'network'
});
const SUBPAGE_OWNER = Object.freeze({
	updates: 'system',
	devices: 'network',
	hotspot: 'apps'
});

export function routeTarget(route) {
	const key = String(route || '')
		.trim()
		.toLowerCase();
	return ROUTE_ALIAS[key] || key;
}
export function menuOwner(route) {
	const target = routeTarget(route);
	return SUBPAGE_OWNER[target] || target;
}
export function primaryNavigation(pages, capabilities = {}) {
	const unique = new Set();
	const primary = new Set(PRIMARY_ROUTES);
	return pages.filter(page => {
		const key = page.id;
		if (!primary.has(key) || unique.has(key)) return false;
		if (page.capability && capabilities[page.capability] === false) return false;
		unique.add(key);
		return true;
	});
}
