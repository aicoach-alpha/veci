import { badge, escapeHtml } from '../lib/dom.js';

function interfaceCards(wireless) {
	const cards = [];
	for (const [radioName, radio] of Object.entries(wireless || {})) {
		const channel = radio.config?.channel ?? radio.config?.frequency ?? 'Auto';
		for (const iface of radio.interfaces || []) {
			const config = iface.config || {};
			cards.push({
				radioName,
				channel,
				ssid: config.ssid || iface.ifname || 'Unnamed Wi-Fi',
				ifname: iface.ifname || '',
				mode: config.mode || 'ap',
				network: Array.isArray(config.network) ? config.network.join(', ') : config.network || '—',
				encryption: config.encryption || 'Open',
				up: radio.up !== false
			});
		}
	}
	return cards;
}

export default {
	id: 'wifi',
	title: 'Wi-Fi',
	eyebrow: 'WIRELESS',
	icon: 'wifi',

	async render({ api, root }) {
		const wireless = await api.wirelessStatus().catch(() => ({}));
		const cards = interfaceCards(wireless);

		root.innerHTML = `
			<div class="page-intro">
				<div><h2>Wi-Fi networks</h2><p>Every radio and SSID is discovered from the running OpenWrt configuration. Nothing is tied to one router model.</p></div>
				<a class="button button-secondary" href="/cgi-bin/luci/admin/network/wireless">Advanced Wi-Fi</a>
			</div>
			${
				cards.length
					? `<div class="wifi-grid">
				${cards
					.map(
						card => `
					<article class="wifi-card">
						<div class="wifi-symbol"><span></span><span></span><span></span></div>
						<div class="wifi-card-heading">
							<div><p class="eyebrow">${escapeHtml(card.radioName)}</p><h3>${escapeHtml(card.ssid)}</h3></div>
							${badge(card.up ? 'Broadcasting' : 'Disabled', card.up ? 'success' : 'neutral')}
						</div>
						<div class="detail-list">
							<div><span>Mode</span><strong>${escapeHtml(card.mode.toUpperCase())}</strong></div>
							<div><span>Interface</span><strong>${escapeHtml(card.ifname || '—')}</strong></div>
							<div><span>Channel</span><strong>${escapeHtml(card.channel)}</strong></div>
							<div><span>Security</span><strong>${escapeHtml(card.encryption)}</strong></div>
							<div><span>Network</span><strong>${escapeHtml(card.network)}</strong></div>
						</div>
					</article>
				`
					)
					.join('')}
			</div>`
					: `
				<div class="empty-state">
					<div class="empty-icon">Wi-Fi</div>
					<h3>No wireless interfaces detected</h3>
					<p>This OpenWrt device may not have Wi-Fi hardware, or wireless is not configured.</p>
				</div>
			`
			}
		`;
	}
};
