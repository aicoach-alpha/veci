import { badge, escapeHtml, setBusy } from '../lib/dom.js';
import { firstAddress, humanProtocol } from '../lib/format.js';

function isUplink(iface) {
	return (
		iface.route?.some(route => route.target === '0.0.0.0' || route.target === '::') ||
		/^(wan|wan6|lte|wwan|cellular|modem)/i.test(iface.interface)
	);
}

export default {
	id: 'internet',
	title: 'Internet',
	eyebrow: 'CONNECTIVITY',
	icon: 'globe',

	async render({ api, state, root, toast }) {
		const result = await api.interfaces();
		const interfaces = result.interface || [];
		state.interfaces = interfaces;
		const ordered = [...interfaces].sort((a, b) => Number(isUplink(b)) - Number(isUplink(a)));

		root.innerHTML = `
			<div class="page-intro">
				<div><h2>Internet connections</h2><p>See how this router reaches the Internet and control individual network interfaces.</p></div>
				<a class="button button-secondary" href="/cgi-bin/luci/admin/network/network">Advanced interfaces</a>
			</div>
			<div class="card-list">
				${ordered
					.map(
						iface => `
					<article class="connection-card ${isUplink(iface) ? 'connection-uplink' : ''}">
						<div class="connection-main">
							<div class="connection-icon">${isUplink(iface) ? '↗' : '↔'}</div>
							<div>
								<div class="connection-title">
									<h3>${escapeHtml(iface.interface)}</h3>
									${badge(iface.up ? 'Online' : 'Offline', iface.up ? 'success' : 'neutral')}
									${isUplink(iface) ? badge('Internet', 'info') : ''}
								</div>
								<p>${escapeHtml(humanProtocol(iface.proto))} · ${escapeHtml(iface.l3_device || iface.device || 'No device')}</p>
							</div>
						</div>
						<div class="connection-meta">
							<div><span>IP address</span><strong>${escapeHtml(firstAddress(iface))}</strong></div>
							<div><span>Uptime</span><strong>${iface.uptime ? Math.floor(iface.uptime / 60) + ' min' : '—'}</strong></div>
						</div>
						<div class="connection-actions">
							<button class="button button-secondary" data-iface="${escapeHtml(iface.interface)}" data-action="${iface.up ? 'down' : 'up'}" type="button">
								${iface.up ? 'Disconnect' : 'Connect'}
							</button>
						</div>
					</article>
				`
					)
					.join('')}
			</div>
		`;

		root.querySelectorAll('[data-iface][data-action]').forEach(button => {
			button.addEventListener('click', async () => {
				const { iface, action } = button.dataset;
				setBusy(button, true);
				try {
					await api.interfaceAction(iface, action);
					toast(`${iface}: ${action === 'up' ? 'connect requested' : 'disconnect requested'}`, 'success');
					setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 1200);
				} catch (error) {
					toast(error.message, 'error');
				} finally {
					setBusy(button, false);
				}
			});
		});
	}
};
