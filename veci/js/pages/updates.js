import { badge, escapeHtml, setBusy } from '../lib/dom.js';

function repoBadge(channel) {
	switch (channel) {
		case 'release':
			return badge('Stable release feeds', 'success');
		case 'snapshot':
			return badge('Snapshot feed detected', 'warning');
		case 'mixed':
			return badge('Mixed feeds', 'warning');
		default:
			return badge('Repository unknown', 'neutral');
	}
}

function boolText(value) {
	return value ? 'Available' : 'Not installed';
}

export default {
	id: 'updates',
	title: 'Updates',
	eyebrow: 'MAINTENANCE',
	icon: 'refresh',

	async render({ api, root, toast }) {
		const loadStatus = async () => api.veci('updateStatus', {}, { timeout: 10000 }).catch(() => ({}));
		let status = await loadStatus();

		const draw = () => {
			const packageUpdates = Number(status.package_updates) || 0;
			const sensitiveUpdates = Number(status.sensitive_updates) || 0;
			const optionalUpdates = Math.max(0, packageUpdates - sensitiveUpdates);
			const channel = status.repository_channel || 'unknown';
			const snapshotWarning = channel === 'snapshot' || channel === 'mixed';

			root.innerHTML = `
				<div class="page-intro">
					<div>
						<h2>Router updates</h2>
						<p>VeCI treats firmware upgrades and package updates separately so the router keeps a coherent OpenWrt image.</p>
					</div>
					<button id="refresh-update-status" class="button button-secondary" type="button">Check status</button>
				</div>

				<div class="content-grid content-grid-2">
					<article class="panel">
						<div class="panel-heading">
							<div><p class="eyebrow">FIRMWARE</p><h3>Installed image</h3></div>
							${badge('Running', 'success')}
						</div>
						<div class="detail-list">
							<div><span>OpenWrt</span><strong>${escapeHtml(status.release || '—')}</strong></div>
							<div><span>Revision</span><strong>${escapeHtml(status.revision || '—')}</strong></div>
							<div><span>Upgrade method</span><strong>sysupgrade image</strong></div>
						</div>
						<a class="button button-primary" href="/cgi-bin/luci/admin/system/flash">Manual firmware update</a>
					</article>

					<article class="panel">
						<div class="panel-heading">
							<div><p class="eyebrow">PACKAGE INDEX</p><h3>Available package changes</h3></div>
							${repoBadge(channel)}
						</div>
						<div class="detail-list">
							<div><span>Upgradeable packages</span><strong>${packageUpdates}</strong></div>
							<div><span>Base-sensitive packages</span><strong>${sensitiveUpdates}</strong></div>
							<div><span>Other packages</span><strong>${optionalUpdates}</strong></div>
							<div><span>owut</span><strong>${boolText(Boolean(status.owut_available))}</strong></div>
						</div>
					</article>
				</div>

				<article class="panel">
					<div class="panel-heading">
						<div><p class="eyebrow">AUTOMATIC UPDATE</p><h3>VeCI signed update channel</h3></div>
						${badge('Not enabled yet', 'neutral')}
					</div>
					<p class="panel-copy">Automatic download and install will only be enabled after VeCI release metadata and firmware checksums are signed with a dedicated project key. Until then, VeCI will never run a blind package upgrade.</p>
				</article>

				<div class="notice-card">
					<strong>${snapshotWarning ? 'Repository warning: development feed detected.' : 'Package upgrades are informational.'}</strong>
					<p>${
						snapshotWarning
							? 'This router is seeing a snapshot or mixed package source. Do not mass-upgrade packages; use a tested firmware image instead.'
							: 'VeCI does not run apk upgrade. Core libraries, kernel-related packages and network services should move together inside a tested firmware image.'
					}</p>
				</div>
			`;

			const refresh = root.querySelector('#refresh-update-status');
			refresh?.addEventListener('click', async () => {
				setBusy(refresh, true, 'Checking…');
				try {
					status = await loadStatus();
					draw();
					toast('Update status refreshed.', 'success');
				} catch (error) {
					toast(error.message || 'Could not refresh update status.', 'error');
					setBusy(refresh, false);
				}
			});
		};

		draw();
	}
};
