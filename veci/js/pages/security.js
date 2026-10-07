import { badge, escapeHtml } from '../lib/dom.js';

function sections(values = {}, type) {
	return Object.entries(values)
		.filter(([, value]) => value['.type'] === type)
		.map(([name, value]) => ({ name, ...value }));
}

export default {
	id: 'security',
	title: 'Security',
	eyebrow: 'PROTECTION',
	icon: 'shield',

	async render({ api, root }) {
		const firewall = await api.uciGet('firewall').catch(() => ({ values: {} }));
		const values = firewall.values || {};
		const zones = sections(values, 'zone');
		const rules = sections(values, 'rule');
		const redirects = sections(values, 'redirect');

		root.innerHTML = `
			<div class="page-intro">
				<div><h2>Security center</h2><p>A simpler view of firewall protection, exposed services and traffic rules.</p></div>
				<a class="button button-secondary" href="/cgi-bin/luci/admin/network/firewall">Advanced firewall</a>
			</div>

			<div class="security-summary">
				<article class="security-score">
					<div class="security-shield">✓</div>
					<div>
						<p class="eyebrow">FIREWALL STATUS</p>
						<h3>${zones.length ? 'Configured' : 'Review configuration'}</h3>
						<p>${zones.length} zones · ${rules.length} traffic rules · ${redirects.length} port forwards</p>
					</div>
				</article>
				<article class="panel">
					<div class="panel-heading"><div><p class="eyebrow">EXPOSURE</p><h3>Port forwards</h3></div>${badge(String(redirects.length), redirects.length ? 'warning' : 'success')}</div>
					<p class="panel-copy">${redirects.length ? 'Review forwarded ports and confirm they are still required.' : 'No configured firewall redirects were detected.'}</p>
				</article>
			</div>

			<div class="content-grid content-grid-2">
				<article class="panel">
					<div class="panel-heading"><div><p class="eyebrow">ZONES</p><h3>Trust boundaries</h3></div></div>
					<div class="zone-list">
						${
							zones.length
								? zones
										.map(
											zone => `
							<div class="zone-row">
								<div><strong>${escapeHtml(zone.name || zone['.name'])}</strong><span>${escapeHtml(Array.isArray(zone.network) ? zone.network.join(', ') : zone.network || 'No network')}</span></div>
								<div class="zone-policy"><span>IN ${escapeHtml(zone.input || '—')}</span><span>FWD ${escapeHtml(zone.forward || '—')}</span><span>OUT ${escapeHtml(zone.output || '—')}</span></div>
							</div>
						`
										)
										.join('')
								: '<p class="panel-copy">No firewall zones found.</p>'
						}
					</div>
				</article>
				<article class="panel">
					<div class="panel-heading"><div><p class="eyebrow">GUIDANCE</p><h3>Keep the router safe</h3></div></div>
					<ul class="check-list">
						<li><span>✓</span> Keep the admin UI on trusted LAN/Wi-Fi only.</li>
						<li><span>✓</span> Remove unused port forwards.</li>
						<li><span>✓</span> Use WPA2/WPA3 with a strong Wi-Fi password.</li>
						<li><span>✓</span> Keep OpenWrt packages and firmware intentionally maintained.</li>
					</ul>
				</article>
			</div>
		`;
	}
};
