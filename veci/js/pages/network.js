import { badge, escapeHtml } from '../lib/dom.js';
import { firstAddress, humanProtocol } from '../lib/format.js';

export default {
	id: 'network',
	title: 'Network',
	eyebrow: 'ADVANCED NETWORKING',
	icon: 'network',

	async render({ api, root }) {
		const [interfacesResult, inventory] = await Promise.all([
			api.interfaces(),
			api.veci('networkInventory').catch(() => ({ bridges: [], ports: [] }))
		]);
		const interfaces = interfacesResult.interface || [];

		root.innerHTML = `
			<div class="page-intro">
				<div><h2>Network layout</h2><p>Interfaces, bridges and physical ports without exposing raw UCI structure first.</p></div>
				<a class="button button-secondary" href="/cgi-bin/luci/admin/network/network">Expert network editor</a>
			</div>

			<div class="panel table-panel">
				<div class="panel-heading"><div><p class="eyebrow">INTERFACES</p><h3>Logical networks</h3></div><span class="count-pill">${interfaces.length}</span></div>
				<div class="table-scroll">
					<table class="veci-table">
						<thead><tr><th>Name</th><th>Status</th><th>Protocol</th><th>Device</th><th>Address</th></tr></thead>
						<tbody>
							${interfaces
								.map(
									iface => `
								<tr>
									<td><strong>${escapeHtml(iface.interface)}</strong></td>
									<td>${badge(iface.up ? 'Up' : 'Down', iface.up ? 'success' : 'neutral')}</td>
									<td>${escapeHtml(humanProtocol(iface.proto))}</td>
									<td class="mono">${escapeHtml(iface.l3_device || iface.device || '—')}</td>
									<td class="mono">${escapeHtml(firstAddress(iface))}</td>
								</tr>
							`
								)
								.join('')}
						</tbody>
					</table>
				</div>
			</div>

			<div class="content-grid content-grid-2">
				<article class="panel">
					<div class="panel-heading"><div><p class="eyebrow">BRIDGES</p><h3>Layer-2 groups</h3></div><span class="count-pill">${inventory.bridges?.length || 0}</span></div>
					<div class="chip-list">
						${(inventory.bridges || []).length ? inventory.bridges.map(bridge => `<span class="chip"><strong>${escapeHtml(bridge.name)}</strong> ${escapeHtml((bridge.members || []).join(', ') || 'empty')}</span>`).join('') : '<p class="panel-copy">No bridge inventory returned.</p>'}
					</div>
				</article>
				<article class="panel">
					<div class="panel-heading"><div><p class="eyebrow">PHYSICAL</p><h3>Ports</h3></div><span class="count-pill">${inventory.ports?.length || 0}</span></div>
					<div class="chip-list">
						${(inventory.ports || []).length ? inventory.ports.map(port => `<span class="chip mono">${escapeHtml(port)}</span>`).join('') : '<p class="panel-copy">No physical ports were identified.</p>'}
					</div>
				</article>
			</div>
		`;
	}
};
