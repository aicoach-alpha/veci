import { badge, escapeHtml, setBusy } from '../lib/dom.js';
import { formatBytes, formatDuration, formatMemory } from '../lib/format.js';

export default {
	id: 'system',
	title: 'System',
	eyebrow: 'DEVICE',
	icon: 'system',

	async render({ api, state, root, toast, confirm }) {
		const [board, info, health] = await Promise.all([
			api.board(),
			api.systemInfo(),
			api.veci('health').catch(() => ({}))
		]);
		const memory = formatMemory(info.memory || {});
		const model = board.model || board.board_name || 'OpenWrt Router';
		const firmware = board.release?.description || board.release?.version || 'OpenWrt';

		root.innerHTML = `
			<div class="page-intro">
				<div><h2>System</h2><p>Hardware identity comes directly from OpenWrt. VeCI never substitutes a hardcoded router model.</p></div>
				<a class="button button-secondary" href="/cgi-bin/luci/admin/system/system">Advanced system settings</a>
			</div>

			<section class="device-profile">
				<div class="device-profile-mark">V</div>
				<div class="device-profile-main">
					<p class="eyebrow">HARDWARE</p>
					<h3>${escapeHtml(model)}</h3>
					<p>${escapeHtml(board.board_name || 'OpenWrt device')}</p>
				</div>
				<div class="device-profile-status">${badge('Running', 'success')}</div>
			</section>

			<div class="content-grid content-grid-2">
				<article class="panel">
					<div class="panel-heading"><div><p class="eyebrow">SOFTWARE</p><h3>Firmware</h3></div></div>
					<div class="detail-list">
						<div><span>OpenWrt</span><strong>${escapeHtml(firmware)}</strong></div>
						<div><span>Kernel</span><strong>${escapeHtml(board.kernel || '—')}</strong></div>
						<div><span>Architecture</span><strong>${escapeHtml(board.system || board.release?.target || '—')}</strong></div>
					</div>
				</article>
				<article class="panel">
					<div class="panel-heading"><div><p class="eyebrow">RESOURCES</p><h3>Runtime</h3></div></div>
					<div class="detail-list">
						<div><span>Uptime</span><strong>${escapeHtml(formatDuration(info.uptime || 0))}</strong></div>
						<div><span>Memory used</span><strong>${formatBytes(memory.used)} / ${formatBytes(memory.total)}</strong></div>
						<div><span>Load</span><strong>${escapeHtml((info.load || []).map(value => (Number(value) / 65535).toFixed(2)).join(' · ') || '—')}</strong></div>
						<div><span>Storage</span><strong>${escapeHtml(health.overlay || '—')}</strong></div>
					</div>
				</article>
			</div>

			<article class="panel danger-panel">
				<div class="panel-heading">
					<div><p class="eyebrow">POWER</p><h3>Restart router</h3></div>
					<button id="reboot-router" class="button button-danger" type="button">Reboot</button>
				</div>
				<p class="panel-copy">The router will disconnect clients temporarily while OpenWrt restarts.</p>
			</article>
		`;

		const reboot = root.querySelector('#reboot-router');
		reboot.addEventListener('click', async () => {
			const allowed = await confirm({
				title: 'Reboot this router?',
				message: 'All network connections will be interrupted for a short time.',
				confirmLabel: 'Reboot router',
				tone: 'danger'
			});
			if (!allowed) return;
			setBusy(reboot, true, 'Rebooting…');
			try {
				await api.call('system', 'reboot', {});
				toast('Reboot command sent', 'success');
			} catch (error) {
				toast(error.message, 'error');
				setBusy(reboot, false);
			}
		});

		state.board = board;
		state.system = info;
	}
};
