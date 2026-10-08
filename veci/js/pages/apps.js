import { badge, escapeHtml } from '../lib/dom.js';

const appLabels = {
	opennds: ['Guest portal', 'Captive portal engine', false],
	sqm: ['Smart Queue', 'Queue management', true],
	ddns: ['Dynamic DNS', 'Hostname updates', false],
	wireguard: ['WireGuard', 'VPN capability', true],
	voucher: ['Voucher', 'Time-limited guest access', true]
};

export default {
	id: 'apps',
	title: 'Apps',
	eyebrow: 'EXTENSIONS',
	icon: 'apps',

	async render({ api, root }) {
		const [capabilities, updateStatus] = await Promise.all([
			api.veci('capabilities').catch(() => ({})),
			api.veci('updateStatus', {}, { timeout: 10000 }).catch(() => ({}))
		]);
		const kernelFeedMismatch = Boolean(updateStatus.kernel_feed_mismatch);
		const customFeedConfigured = Boolean(updateStatus.custom_feed_configured);
		root.innerHTML = `
			<div class="page-intro">
				<div><h2>Router apps</h2><p>Optional capabilities stay outside VeCI Core so small routers do not pay the RAM and flash cost for features they never use.</p></div>
			</div>
			<div class="app-grid">
				${Object.entries(appLabels)
					.map(([key, [title, description, requiresKernel]]) => {
						const installed = Boolean(capabilities[key]);
						let statusLabel = installed ? 'Available' : 'Not installed';
						let tone = installed ? 'success' : 'neutral';
						if (!installed && requiresKernel && kernelFeedMismatch) {
							statusLabel = 'Needs VeCI feed';
							tone = 'warning';
						}
						return `
						<article class="app-card">
							<div class="app-card-icon">${title.slice(0, 1)}</div>
							<div class="app-card-copy">
								<div class="app-card-title"><h3>${escapeHtml(title)}</h3>${badge(statusLabel, tone)}</div>
								<p>${escapeHtml(description)}</p>
							</div>
						</article>
					`;
					})
					.join('')}
			</div>
			<div class="notice-card">
				<strong>${customFeedConfigured ? 'VeCI app feed is configured.' : 'VeCI-matched app feed is not configured yet.'}</strong>
				<p>${
					kernelFeedMismatch
						? 'This custom firmware has a different kernel ABI from the official target feed. Kernel-dependent apps such as SQM and WireGuard must come from a VeCI feed built from the exact same firmware source.'
						: 'Optional extensions stay separated from VeCI Core and will be installed only from a compatible, signed package source.'
				}</p>
			</div>
		`;
	}
};
