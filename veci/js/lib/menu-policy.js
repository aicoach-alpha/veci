// One canonical owner per feature; aliases never produce duplicate navigation.
export const PRIMARY_ROUTES = Object.freeze([
  'home', 'internet', 'wifi', 'cellular', 'network', 'security', 'system', 'apps'
]);
export const FEATURE_OWNER = Object.freeze({
  firmware: 'system',
  update: 'system',
  ota: 'system',
  ipv6: 'network',
  'connected-devices': 'devices'
});
export function ownerOf(route) {
  const id = String(route || '').trim().toLowerCase();
  return FEATURE_OWNER[id] || id;
}
export function primaryNavigation(pages, capabilities = {}) {
  const allowed = new Set(PRIMARY_ROUTES);
  const unique = new Set();
  return pages.filter(page => {
    const id = ownerOf(page.id);
    if (!allowed.has(id) || unique.has(id)) return false;
    if (page.capability && capabilities[page.capability] === false) return false;
    unique.add(id);
    return true;
  });
}
