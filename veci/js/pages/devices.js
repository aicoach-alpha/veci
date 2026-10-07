import { badge, escapeHtml } from '../lib/dom.js';
import { relativeExpiry } from '../lib/format.js';

export default {
	id: 'devices',
	title: 'Devices',
	eyebrow: 'CLIENTS',
	icon: 'devices',

	async render({ api, root }) {
		const result = await api.veci('clients').catch(() => ({ clients: [] }));
		const clients = result.clients || [];

		root.innerHTML = `
			<div class="page-intro">
				<div><h2>Connected devices</h2><p>Clients discovered from the router lease table. VeCI keeps the list lightweight so it also works on small OpenWrt hardware.</p></div>
				<a class="button button-secondary" href="/cgi-bin/luci/admin/status/overview">Open detailed status</a>
			</div>
			<div class="panel table-panel">
				<div class="panel-heading">
					<div><p class="eyebrow">CURRENT LEASES</p><h3>${clients.length} device${clients.length === 1 ? '' : 's'}</h3></div>
					${badge(clients.length ? 'Active' : 'No leases', clients.length ? 'success' : 'neutral')}
				</div>
				<div class="table-scroll">
					<table class="veci-table">
						<thead><tr><th>Device</th><th>IP address</th><th>MAC address</th><th>Lease</th></tr></thead>
						<tbody>
							${
								clients.length
									? clients
											.map(
												client => `
								<tr>
									<td><strong>${escapeHtml(client.hostname || 'Unknown device')}</strong></td>
									<td>${escapeHtml(client.ipaddr || '—')}</td>
									<td class="mono">${escapeHtml(client.macaddr || '—')}</td>
									<td>${escapeHtml(relativeExpiry(client.expires))}</td>
								</tr>
							`
											)
											.join('')
									: '<tr><td colspan="4" class="table-empty">No DHCP leases are currently visible.</td></tr>'
							}
						</tbody>
					</table>
				</div>
			</div>
		`;
	}
};
