import { badge, escapeHtml, setBusy } from '../lib/dom.js';
import { formatBytes, formatDuration, formatMemory } from '../lib/format.js';

export default {
	id: 'system',
	title: 'System',
	eyebrow: 'DEVICE',
	icon: 'system',

	async render({ api, state, root, toast, confirm }) {
		const [board, info, health, systemConfig] = await Promise.all([
			api.board(),
			api.systemInfo(),
			api.veci('health').catch(() => ({})),
			api.uciGet('system').catch(() => ({ values: {} }))
		]);
		const memory = formatMemory(info.memory || {});
		const model = board.model || board.board_name || 'OpenWrt Router';
		const firmware = board.release?.description || board.release?.version || 'OpenWrt';
		const systemSection = Object.entries(systemConfig.values || {}).find(
			([, value]) => value['.type'] === 'system'
		);
		const systemSectionId = systemSection?.[0] || null;
		const configuredHostname = systemSection?.[1]?.hostname || board.hostname || 'OpenWrt';

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

			<article class="panel">
				<div class="panel-heading">
					<div><p class="eyebrow">ROUTER NAME</p><h3>Hostname</h3></div>
				</div>
				<form id="hostname-form" class="inline-setting-form">
					<label class="field">
						<span>Hostname</span>
						<input id="router-hostname" value="${escapeHtml(configuredHostname)}" maxlength="63" autocomplete="off" />
					</label>
					<button id="save-hostname" class="button button-primary" type="submit">Save</button>
				</form>
				<p class="panel-copy">Use letters, numbers and hyphens only. Reboot after changing the hostname so every router service picks up the new name.</p>
			</article>

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


			<article class="panel">
				<div class="panel-heading">
					<div><p class="eyebrow">FIRMWARE MANAGEMENT</p><h3>Firmware updates</h3></div>
					<button id="veci-check-updates" class="button button-secondary" type="button">Check OTA updates</button>
				</div>
				<p id="veci-update-status" class="panel-copy" role="status">Checking update support…</p>
				<p class="panel-copy">Manual upload and flashing require a validated, compatible image and explicit confirmation; this build does not yet enable flashing.</p>
			</article>

			<article class="panel danger-panel">
				<div class="panel-heading">
					<div><p class="eyebrow">POWER</p><h3>Restart router</h3></div>
					<button id="reboot-router" class="button button-danger" type="button">Reboot</button>
				</div>
				<p class="panel-copy">The router will disconnect clients temporarily while OpenWrt restarts.</p>
			</article>
		`;

		const hostnameForm = root.querySelector('#hostname-form');
		hostnameForm?.addEventListener('submit', async event => {
			event.preventDefault();
			const button = root.querySelector('#save-hostname');
			const hostname = root.querySelector('#router-hostname').value.trim();
			if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(hostname)) {
				toast('Hostname must be 1–63 characters using letters, numbers and hyphens.', 'error');
				return;
			}
			if (!systemSectionId) {
				toast('OpenWrt system configuration section was not found.', 'error');
				return;
			}
			setBusy(button, true, 'Saving…');
			try {
				await api.uciSet('system', systemSectionId, { hostname });
				await api.uciCommit('system');
				toast('Hostname saved. Reboot to apply it to all services.', 'success');
			} catch (error) {
				toast(error.message || 'Could not save hostname.', 'error');
			} finally {
				setBusy(button, false);
			}
		});


		const updateButton = root.querySelector('#veci-check-updates');
		const updateStatus = root.querySelector('#veci-update-status');
		const updateRpc = () => api.call('veci.firmware', 'status', {}, { timeout: 7000 });
		updateRpc().then(result => {
			if (result?.schema === 1 && result?.ota_install_enabled === false) {
				updateStatus.textContent = 'OTA discovery available. Automatic installation and manual flashing are disabled pending verified release support.';
			} else {
				updateStatus.textContent = 'Firmware update backend is not ready.';
			}
		}).catch(() => { updateStatus.textContent = 'Firmware update backend is not installed.'; });
		updateButton?.addEventListener('click', async () => {
			setBusy(updateButton, true, 'Checking…');
			updateStatus.textContent = 'Checking signed release channel…';
			try {
				const result = await api.call('veci.firmware', 'check', {}, { timeout: 18000 });
				if (result?.ok !== true) throw Error(result?.reason || 'update_check_failed');
				if (result.state === 'no_release') {
					updateStatus.textContent = 'No published VeCI firmware update for this channel.';
				} else if (result.state === 'unverified_release') {
					updateStatus.textContent = 'Release metadata is not cryptographically verified. Flashing remains disabled.';
				} else {
					updateStatus.textContent = 'Firmware update not available.';
				}
			} catch (error) {
				updateStatus.textContent = 'Could not verify available firmware releases.';
				toast(error.message || 'OTA check failed', 'warning');
			} finally {
				setBusy(updateButton, false);
			}
		});

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
