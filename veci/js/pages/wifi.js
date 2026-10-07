import { badge, escapeHtml, setBusy } from '../lib/dom.js';

const PERSONAL_SECURITY = new Set(['psk2', 'psk-mixed', 'sae', 'sae-mixed']);

function humanSecurity(value = 'none') {
	const labels = {
		none: 'Open / no password',
		psk2: 'WPA2 Personal',
		'psk-mixed': 'WPA/WPA2 Personal',
		sae: 'WPA3 Personal',
		'sae-mixed': 'WPA2/WPA3 Personal'
	};
	return labels[value] || value;
}

function boolOption(value) {
	return value === '1' || value === 1 || value === true;
}

function findRuntime(wireless, section, config) {
	for (const [radioName, radio] of Object.entries(wireless || {})) {
		for (const iface of radio.interfaces || []) {
			if (iface.section === section) return { radioName, radio, iface };
			if (config.ssid && iface.config?.ssid === config.ssid && iface.config?.mode === config.mode) {
				return { radioName, radio, iface };
			}
		}
	}
	return null;
}

function buildNetworks(configResult, wireless) {
	const values = configResult.values || {};
	return Object.entries(values)
		.filter(([, config]) => config['.type'] === 'wifi-iface')
		.map(([section, config]) => {
			const runtime = findRuntime(wireless, section, config);
			const radioConfig = values[config.device] || {};
			return {
				section,
				config,
				runtime,
				radio: config.device || runtime?.radioName || 'radio',
				channel: radioConfig.channel || runtime?.radio?.config?.channel || 'auto',
				htmode: radioConfig.htmode || runtime?.radio?.config?.htmode || '',
				up: !boolOption(config.disabled) && runtime?.radio?.up !== false,
				hasKey: Boolean(config.key)
			};
		});
}

function validWifiPassword(value) {
	if (/^[0-9A-Fa-f]{64}$/.test(value)) return true;
	const length = new TextEncoder().encode(value).length;
	return length >= 8 && length <= 63;
}

export default {
	id: 'wifi',
	title: 'Wi-Fi',
	eyebrow: 'WIRELESS',
	icon: 'wifi',

	async render({ api, root, toast, confirm }) {
		const [wireless, configResult] = await Promise.all([
			api.wirelessStatus().catch(() => ({})),
			api.uciGet('wireless').catch(() => ({ values: {} }))
		]);
		const networks = buildNetworks(configResult, wireless);
		const networkMap = new Map(networks.map(network => [network.section, network]));

		root.innerHTML = `
			<div class="page-intro">
				<div>
					<h2>Wi-Fi networks</h2>
					<p>Manage everyday SSID and security settings here. Radio tuning, 802.11 details and unusual enterprise modes remain available in Expert.</p>
				</div>
				<a class="button button-secondary" href="/cgi-bin/luci/admin/network/wireless">Advanced Wi-Fi</a>
			</div>

			${
				networks.length
					? `
						<div class="wifi-grid">
							${networks
								.map(
									network => `
									<article class="wifi-card">
										<div class="wifi-symbol"><span></span><span></span><span></span></div>
										<div class="wifi-card-heading">
											<div>
												<p class="eyebrow">${escapeHtml(network.radio)}</p>
												<h3>${escapeHtml(network.config.ssid || 'Unnamed Wi-Fi')}</h3>
											</div>
											${badge(network.up ? 'Broadcasting' : 'Disabled', network.up ? 'success' : 'neutral')}
										</div>
										<div class="detail-list">
											<div><span>Mode</span><strong>${escapeHtml((network.config.mode || 'ap').toUpperCase())}</strong></div>
											<div><span>Channel</span><strong>${escapeHtml(network.channel)}${network.htmode ? ' · ' + escapeHtml(network.htmode) : ''}</strong></div>
											<div><span>Security</span><strong>${escapeHtml(humanSecurity(network.config.encryption || 'none'))}</strong></div>
											<div><span>Network</span><strong>${escapeHtml(Array.isArray(network.config.network) ? network.config.network.join(', ') : network.config.network || '—')}</strong></div>
										</div>
										<div class="wifi-card-actions">
											${
												(network.config.mode || 'ap') === 'ap'
													? `<button class="button button-secondary" data-edit-wifi="${escapeHtml(network.section)}" type="button">Edit Wi-Fi</button>`
													: '<span class="readonly-note">Expert-only mode</span>'
											}
										</div>
									</article>
								`
								)
								.join('')}
						</div>
					`
					: `
						<div class="empty-state">
							<div class="empty-icon">Wi-Fi</div>
							<h3>No Wi-Fi networks configured</h3>
							<p>This device may not have wireless hardware, or no wifi-iface sections are present in OpenWrt.</p>
						</div>
					`
			}

			<section id="wifi-editor" class="panel editor-panel hidden" aria-live="polite">
				<div class="panel-heading">
					<div><p class="eyebrow">EDIT WI-FI</p><h3 id="wifi-editor-title">Network</h3></div>
					<button id="wifi-editor-close" class="button button-secondary" type="button">Cancel</button>
				</div>

				<form id="wifi-editor-form">
					<input type="hidden" id="wifi-section" />
					<div class="editor-grid">
						<label class="field">
							<span>Wi-Fi name (SSID)</span>
							<input id="wifi-ssid" type="text" maxlength="32" autocomplete="off" required />
						</label>

						<label class="field">
							<span>Security</span>
							<select id="wifi-encryption"></select>
						</label>

						<label class="field field-wide" id="wifi-password-field">
							<span>Wi-Fi password</span>
							<input id="wifi-password" type="password" autocomplete="new-password" placeholder="Leave blank to keep the existing password" />
							<small>8–63 characters, or a 64-digit hexadecimal PSK. Existing passwords are never shown.</small>
						</label>
					</div>

					<div class="toggle-grid">
						<label class="toggle-row">
							<div><strong>Wi-Fi enabled</strong><span>Broadcast and accept clients on this SSID.</span></div>
							<input id="wifi-enabled" type="checkbox" />
						</label>
						<label class="toggle-row">
							<div><strong>Hide SSID</strong><span>Stops beaconing the network name; this is not a security feature.</span></div>
							<input id="wifi-hidden" type="checkbox" />
						</label>
						<label class="toggle-row">
							<div><strong>Client isolation</strong><span>Prevent wireless clients on this SSID from talking directly to each other.</span></div>
							<input id="wifi-isolate" type="checkbox" />
						</label>
					</div>

					<div class="editor-warning">
						Applying Wi-Fi changes reloads the wireless service. If you are connected through the SSID being changed, your device may disconnect and need to reconnect.
					</div>

					<div class="editor-actions">
						<button id="wifi-save" class="button button-primary" type="submit">Apply changes</button>
					</div>
				</form>
			</section>
		`;

		const editor = root.querySelector('#wifi-editor');
		const form = root.querySelector('#wifi-editor-form');
		const security = root.querySelector('#wifi-encryption');
		const passwordField = root.querySelector('#wifi-password-field');

		function updatePasswordVisibility() {
			passwordField.classList.toggle('hidden', !PERSONAL_SECURITY.has(security.value));
		}

		function closeEditor() {
			editor.classList.add('hidden');
			form.reset();
		}

		function openEditor(section) {
			const network = networkMap.get(section);
			if (!network) return;
			const encryption = network.config.encryption || 'none';

			root.querySelector('#wifi-section').value = section;
			root.querySelector('#wifi-editor-title').textContent = network.config.ssid || section;
			root.querySelector('#wifi-ssid').value = network.config.ssid || '';
			root.querySelector('#wifi-enabled').checked = !boolOption(network.config.disabled);
			root.querySelector('#wifi-hidden').checked = boolOption(network.config.hidden);
			root.querySelector('#wifi-isolate').checked = boolOption(network.config.isolate);
			root.querySelector('#wifi-password').value = '';
			root.querySelector('#wifi-password').dataset.hasExisting = network.hasKey ? '1' : '0';

			const supported = ['sae-mixed', 'sae', 'psk2', 'psk-mixed', 'none'];
			const options = supported.includes(encryption) ? supported : [encryption, ...supported];
			security.innerHTML = options
				.map(
					value =>
						`<option value="${escapeHtml(value)}">${escapeHtml(humanSecurity(value))}${value === encryption && !supported.includes(value) ? ' (current)' : ''}</option>`
				)
				.join('');
			security.value = encryption;
			updatePasswordVisibility();

			editor.classList.remove('hidden');
			editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
			root.querySelector('#wifi-ssid').focus({ preventScroll: true });
		}

		root.querySelectorAll('[data-edit-wifi]').forEach(button => {
			button.addEventListener('click', () => openEditor(button.dataset.editWifi));
		});
		root.querySelector('#wifi-editor-close').addEventListener('click', closeEditor);
		security.addEventListener('change', updatePasswordVisibility);

		form.addEventListener('submit', async event => {
			event.preventDefault();
			const section = root.querySelector('#wifi-section').value;
			const network = networkMap.get(section);
			if (!network) return;

			const ssid = root.querySelector('#wifi-ssid').value.trim();
			const ssidLength = new TextEncoder().encode(ssid).length;
			if (!ssid || ssidLength > 32) {
				toast('SSID must be between 1 and 32 bytes', 'error');
				return;
			}

			const encryption = security.value;
			const password = root.querySelector('#wifi-password').value;
			const hadPassword = root.querySelector('#wifi-password').dataset.hasExisting === '1';
			const switchingToPersonal = PERSONAL_SECURITY.has(encryption);

			if (password && !validWifiPassword(password)) {
				toast('Wi-Fi password must be 8–63 characters or 64 hexadecimal digits', 'error');
				return;
			}
			if (switchingToPersonal && !password && !hadPassword) {
				toast('Enter a Wi-Fi password for the selected security mode', 'error');
				return;
			}

			const allowed = await confirm({
				title: 'Apply Wi-Fi changes?',
				message: 'Wireless will reload and connected clients may briefly disconnect.',
				confirmLabel: 'Apply Wi-Fi',
				tone: 'primary'
			});
			if (!allowed) return;

			const save = root.querySelector('#wifi-save');
			setBusy(save, true, 'Applying…');
			try {
				const values = {
					ssid,
					encryption,
					disabled: root.querySelector('#wifi-enabled').checked ? '0' : '1',
					hidden: root.querySelector('#wifi-hidden').checked ? '1' : '0',
					isolate: root.querySelector('#wifi-isolate').checked ? '1' : '0'
				};
				if (password) values.key = password;

				await api.uciSet('wireless', section, values);
				if (encryption === 'none') await api.uciDelete('wireless', section, 'key').catch(() => {});
				await api.uciCommit('wireless');
				const result = await api.veci('wifiReload');
				if (result.ok === false) throw new Error(result.error || 'Wireless reload failed');

				toast('Wi-Fi settings applied', 'success');
				closeEditor();
				setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 1800);
			} catch (error) {
				toast(error.message || 'Unable to apply Wi-Fi settings', 'error');
			} finally {
				setBusy(save, false);
			}
		});
	}
};
