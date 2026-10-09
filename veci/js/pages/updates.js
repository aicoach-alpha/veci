import { badge, escapeHtml, setBusy } from '../lib/dom.js';
import { formatBytes } from '../lib/format.js';

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

async function sha256File(file) {
	const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
	return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(bytes) {
	let binary = '';
	for (const value of bytes) binary += String.fromCharCode(value);
	return btoa(binary);
}

export default {
	id: 'updates',
	title: 'Updates',
	eyebrow: 'MAINTENANCE',
	icon: 'refresh',

	async render({ api, root, toast, confirm }) {
		const loadStatus = async () =>
			Promise.all([
				api.veci('updateStatus', {}, { timeout: 10000 }).catch(() => ({})),
				api.veci('firmwareReady', {}, { timeout: 10000 }).catch(() => ({ ready: false }))
			]);
		let [status, ready] = await loadStatus();
		let remote = null;

		const draw = () => {
			const packageUpdates = Number(status.package_updates) || 0;
			const sensitiveUpdates = Number(status.sensitive_updates) || 0;
			const optionalUpdates = Math.max(0, packageUpdates - sensitiveUpdates);
			const channel = status.repository_channel || 'unknown';
			const snapshotWarning = channel === 'snapshot' || channel === 'mixed';
			const kernelFeedMismatch = Boolean(status.kernel_feed_mismatch);
			const customFeed = Boolean(status.custom_feed_configured);

			const remoteSummary = remote
				? `
					<div class="detail-list">
						<div><span>Version</span><strong>${escapeHtml(remote.version || '—')}</strong></div>
						<div><span>Board</span><strong>${escapeHtml(remote.board || '—')}</strong></div>
						<div><span>Download size</span><strong>${formatBytes(Number(remote.bytes) || 0)}</strong></div>
						<div><span>SHA256</span><strong class="mono">${escapeHtml(remote.sha256 || '—')}</strong></div>
					</div>
					${remote.release_notes ? `<p class="panel-copy">${escapeHtml(remote.release_notes)}</p>` : ''}
					<button id="download-firmware" class="button button-primary" type="button">Download & verify</button>
				`
				: '<p class="panel-copy">No GitHub release has been checked in this session.</p>';

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
						<label class="field">
							<span>Manual sysupgrade image</span>
							<input id="manual-firmware-file" type="file" accept=".bin,application/octet-stream" />
						</label>
						<button id="upload-manual-firmware" class="button button-primary" type="button">Upload & verify</button>
						<a class="button button-secondary" href="/cgi-bin/luci/admin/system/flash">Expert flash page</a>
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
							<div><span>Kernel feed match</span><strong>${kernelFeedMismatch ? 'Mismatch — firmware rebuild required' : 'No mismatch detected'}</strong></div>
							<div><span>VeCI custom feed</span><strong>${customFeed ? 'Configured' : 'Not configured'}</strong></div>
							<div><span>owut</span><strong>${boolText(Boolean(status.owut_available))}</strong></div>
						</div>
					</article>
				</div>

				<div class="content-grid content-grid-2">
					<article class="panel">
						<div class="panel-heading">
							<div><p class="eyebrow">GITHUB CHANNEL</p><h3>Official VeCI firmware</h3></div>
							${remote ? badge('Checked', 'success') : badge('Not checked', 'neutral')}
						</div>
						${remoteSummary}
						<button id="check-firmware" class="button button-secondary" type="button">Check GitHub release</button>
					</article>

					<article class="panel">
						<div class="panel-heading">
							<div><p class="eyebrow">VALIDATION</p><h3>Staged firmware</h3></div>
							${ready.ready ? badge('Ready', 'success') : badge('Nothing staged', 'neutral')}
						</div>
						${
							ready.ready
								? `
									<div class="detail-list">
										<div><span>Version</span><strong>${escapeHtml(ready.version || '—')}</strong></div>
										<div><span>Size</span><strong>${formatBytes(Number(ready.bytes) || 0)}</strong></div>
										<div><span>SHA256</span><strong class="mono">${escapeHtml(ready.sha256 || '—')}</strong></div>
									</div>
									<div class="detail-list">
										<div><span>Source</span><strong>${escapeHtml(ready.source || '—')}</strong></div>
										<div><span>Signed metadata</span><strong>${ready.signed ? 'Verified' : 'No'}</strong></div>
									</div>
									<p class="panel-copy">Checksum and <code>sysupgrade -T</code> validation passed.</p>
									${
										ready.apply_enabled && (ready.source !== 'channel' || ready.signed)
											? '<button id="apply-firmware" class="button button-danger" type="button">Install & reboot</button>'
											: '<p class="panel-copy">Install is locked by the firmware safety profile.</p>'
									}
								`
								: '<p class="panel-copy">Firmware must pass board, size, SHA256 and <code>sysupgrade -T</code> checks before install can be offered.</p>'
						}
					</article>
				</div>

				<article class="panel">
					<div class="panel-heading">
						<div><p class="eyebrow">AUTOMATIC UPDATE</p><h3>VeCI signed update channel</h3></div>						${badge('Not enabled yet', 'neutral')}
					</div>
					<p class="panel-copy">Automatic download and install will only be enabled after VeCI release metadata and firmware checksums are signed with a dedicated project key. Until then, VeCI will never run a blind package upgrade.</p>
				</article>

				<div class="notice-card">
					<strong>${
						kernelFeedMismatch
							? 'Kernel package feed does not match this custom firmware.'
							: snapshotWarning
								? 'Repository warning: development feed detected.'
								: 'Package upgrades are informational.'
					}</strong>
					<p>${
						kernelFeedMismatch
							? 'Do not install the offered kernel or kernel modules from the official target feed. VeCI must use packages built against the exact firmware kernel ABI.'
							: snapshotWarning
								? 'This router is seeing a snapshot or mixed package source. Do not mass-upgrade packages; use a tested firmware image instead.'
								: 'VeCI does not run apk upgrade. Core libraries, kernel-related packages and network services should move together inside a tested firmware image.'
					}</p>
				</div>
			`;

			const refresh = root.querySelector('#refresh-update-status');
			refresh?.addEventListener('click', async () => {
				setBusy(refresh, true, 'Checking…');
				try {
					[status, ready] = await loadStatus();
					draw();
					toast('Update status refreshed.', 'success');
				} catch (error) {
					toast(error.message || 'Could not refresh update status.', 'error');
					setBusy(refresh, false);
				}
			});

			const upload = root.querySelector('#upload-manual-firmware');
			const fileInput = root.querySelector('#manual-firmware-file');
			upload?.addEventListener('click', async () => {
				const file = fileInput?.files?.[0];
				if (!file) {
					toast('Choose a sysupgrade .bin file first.', 'error');
					return;
				}

				setBusy(upload, true, 'Preparing…');
				try {
					const start = await api.veci('firmwareUploadStart', {}, { timeout: 10000 });
					if (!start.ok) throw new Error(start.error || 'Could not start firmware upload');
					const maxBytes = Number(start.max_bytes) || 0;
					const chunkBytes = Number(start.chunk_bytes) || 32768;
					if (maxBytes > 0 && file.size > maxBytes)
						throw new Error('Firmware image exceeds this router profile limit');

					upload.textContent = 'Calculating SHA256…';
					const sha256 = await sha256File(file);
					let offset = 0;
					while (offset < file.size) {
						const buffer = await file.slice(offset, offset + chunkBytes).arrayBuffer();
						const data = bytesToBase64(new Uint8Array(buffer));
						const result = await api.veci('firmwareUploadChunk', { offset, data }, { timeout: 30000 });
						if (!result.ok) throw new Error(result.error || 'Firmware upload failed');
						offset = Number(result.next_offset);
						if (!Number.isFinite(offset)) throw new Error('Router returned an invalid upload offset');
						const percent = Math.min(100, Math.round((offset / file.size) * 100));
						upload.textContent = `Uploading ${percent}%…`;
					}

					upload.textContent = 'Validating…';
					const finish = await api.veci(
						'firmwareUploadFinish',
						{ bytes: file.size, sha256 },
						{ timeout: 60000 }
					);
					if (!finish.ok) throw new Error(finish.error || 'Firmware validation failed');
					[, ready] = await loadStatus();
					draw();
					toast('Manual firmware passed SHA256 and sysupgrade validation.', 'success');
				} catch (error) {
					await api.veci('firmwareCancel', {}, { timeout: 10000 }).catch(() => {});
					toast(error.message || 'Could not upload firmware.', 'error');
					setBusy(upload, false);
				}
			});

			const check = root.querySelector('#check-firmware');
			check?.addEventListener('click', async () => {
				setBusy(check, true, 'Checking…');
				try {
					const result = await api.veci('firmwareCheck', {}, { timeout: 30000 });
					if (!result.ok) throw new Error(result.error || 'Firmware channel check failed');
					remote = result;
					draw();
					toast('Firmware metadata validated for this board.', 'success');
				} catch (error) {
					toast(error.message || 'Could not check firmware channel.', 'error');
					setBusy(check, false);
				}
			});

			const apply = root.querySelector('#apply-firmware');
			apply?.addEventListener('click', async () => {
				const allowed = await confirm({
					title: 'Install this firmware now?',
					message:
						'The router will reboot and all network connections will drop. VeCI will revalidate the staged image immediately before sysupgrade.',
					confirmLabel: 'Install & reboot',
					tone: 'danger'
				});
				if (!allowed) return;

				setBusy(apply, true, 'Starting upgrade…');
				try {
					const result = await api.veci('firmwareApply', {}, { timeout: 15000 });
					if (!result.ok) throw new Error(result.error || 'Firmware install was rejected');
					root.innerHTML = `
						<div class="panel">
							<div class="panel-heading">
								<div><p class="eyebrow">FIRMWARE</p><h3>Upgrade started</h3></div>
								${badge('Rebooting', 'warning')}
							</div>
							<p class="panel-copy">Do not disconnect power. The router is applying the validated firmware image and will reboot.</p>
						</div>
					`;
				} catch (error) {
					toast(error.message || 'Could not start firmware install.', 'error');
					setBusy(apply, false);
				}
			});

			const download = root.querySelector('#download-firmware');			download?.addEventListener('click', async () => {
				setBusy(download, true, 'Downloading…');
				try {
					const result = await api.veci('firmwareDownload', {}, { timeout: 180000 });
					if (!result.ok) throw new Error(result.error || 'Firmware validation failed');
					[, ready] = await loadStatus();
					draw();
					toast('Firmware downloaded, checksum verified and sysupgrade test passed.', 'success');
				} catch (error) {
					toast(error.message || 'Could not download firmware.', 'error');
					setBusy(download, false);
				}
			});
		};

		draw();
	}
};
