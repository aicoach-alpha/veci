import { badge, escapeHtml, setBusy } from '../lib/dom.js';

function metric(label, value, suffix = '') {
	const display = value === undefined || value === null || value === '' ? '—' : `${value}${suffix}`;
	return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(display)}</strong></div>`;
}

function normalizeOperator(value) {
	const text = String(value || '').trim();
	if (!text) return 'No operator';

	const parts = text.split(/\s+/);
	if (parts.length % 2 === 0) {
		const half = parts.length / 2;
		const first = parts.slice(0, half).join(' ');
		const second = parts.slice(half).join(' ');
		if (first.toLowerCase() === second.toLowerCase()) return first;
	}

	return text;
}

export default {
	id: 'cellular',
	title: 'Cellular',
	navLabel: 'Cellular',
	eyebrow: 'MOBILE NETWORK',
	icon: 'signal',
	capability: 'cellular',

	async render({ api, root, toast, confirm }) {
		const status = await api.cellularStatus();

		const signalPercent = Number.isFinite(Number(status.signal_percent)) ? Number(status.signal_percent) : null;
		const signalDbm = Number.isFinite(Number(status.signal_dbm)) ? Number(status.signal_dbm) : null;
		const online = status.online === true || status.online === 1 || status.online === '1';
		const sim = status.sim || '—';
		const model = status.model || status.manufacturer || 'Cellular modem';
		const operator = normalizeOperator(status.operator);
		const technology = status.access_tech || status.registration_status || 'Unknown';

		root.innerHTML = `
			<div class="page-intro">
				<div>
					<h2>Mobile connection</h2>
					<p>Signal, SIM and modem health from the cellular integration installed on this router. Data-link state does not by itself verify Internet reachability.</p>
				</div>
				${badge(online ? 'Data link active' : 'Data link down', online ? 'success' : 'danger')}
			</div>

			<div class="cellular-hero">
				<section class="panel">
					<div class="panel-heading">
						<div>
							<p class="eyebrow">MODEM</p>
							<h3>${escapeHtml(model)}</h3>
						</div>
						<strong class="cellular-operator">${escapeHtml(operator)}</strong>
					</div>
					<div class="signal-block">
						<div>
							<span class="signal-number">${signalPercent === null ? '—' : escapeHtml(String(signalPercent))}<small>${signalPercent === null ? '' : '%'}</small></span>
							<span class="signal-label">Signal strength</span>
						</div>
						<div class="signal-bars" aria-label="Signal strength">
							${[20, 40, 60, 80, 100]
								.map(
									limit =>
										`<span class="${signalPercent !== null && signalPercent >= limit ? 'active' : ''}"></span>`
								)
								.join('')}
						</div>
					</div>
					<div class="detail-list">
						${metric('Technology', technology)}
						${metric('Signal', signalDbm, signalDbm === null ? '' : ' dBm')}
						${metric('Registration', status.registration_status || status.registration)}
						${metric('Packet service', status.packet_status || status.packet_attach)}
					</div>
				</section>

				<section class="panel">
					<div class="panel-heading">
						<div><p class="eyebrow">CONNECTION</p><h3>SIM & data</h3></div>
					</div>
					<div class="detail-list">
						${metric('Active SIM', sim)}
						${metric('SIM status', status.sim_status)}
						<div class="detail-list-item" id="cellular-imei-row">
							<span>Modem IMEI (AT cache)</span>
							<strong id="cellular-imei-value">Hidden</strong>
						</div>
						${metric('IPv4', status.ipv4)}
						${metric('Gateway', status.gateway)}
						${metric('Data interface', status.data_interface)}
						${metric('Mode', status.mode)}
						<div id="cellular-internet-status"><span>Internet</span><strong>${online ? 'Checking…' : 'Unavailable'}</strong></div>
					</div>
					<div class="cellular-actions">
						<button class="button button-secondary" id="cellular-imei-toggle" type="button">Show IMEI</button>
						<button class="button button-secondary" id="cellular-reconnect" type="button">Reconnect data</button>
						${status.sim !== undefined ? '<button class="button button-secondary" id="cellular-switch-sim" type="button">Switch SIM</button>' : ''}
					</div>
				</section>
			</div>

			<div class="notice-card">
				<strong>IMEI source: router LTE modem's AT cache</strong>
				<p>Identity is hidden until requested, is not stored by VeCI, and can be stale. The W907-EC MiFi web interface may use a different source. A mismatch requires verification at the modem; VeCI never changes the IMEI.</p>
				<p>VeCI Core remains hardware-independent. This page is available when the router exposes <code>veci.cellular</code>.</p>
			</div>
		`;

		if (online) {
			api.veci('internetStatus', {}, { timeout: 3000 })
				.then(internet => {
					const value = root.querySelector('#cellular-internet-status strong');
					if (!value) return;
					if (internet.status === 'reachable' && internet.reachable === true) value.textContent = 'Reachable';
					else if (internet.status === 'unreachable' && internet.reachable === false)
						value.textContent = 'Unavailable';
					else value.textContent = 'Not verified';
				})
				.catch(() => {
					const value = root.querySelector('#cellular-internet-status strong');
					if (value) value.textContent = 'Not verified';
				});
		}

		const imeiButton = root.querySelector('#cellular-imei-toggle');
		let imeiVisible = false;
		let identityHideTimer;
		imeiButton?.addEventListener('click', async () => {
			const valueElement = root.querySelector('#cellular-imei-value');
			if (!valueElement) return;
			if (imeiVisible) {
				valueElement.textContent = 'Hidden';
				imeiButton.textContent = 'Show IMEI';
				imeiVisible = false;
				clearTimeout(identityHideTimer);
				return;
			}
			setBusy(imeiButton, true, 'Reading…');
			try {
				const identity = await api.call('veci.cellular', 'identity', {}, { timeout: 10000 });
				const imei = String(identity.imei || '');
				if (!identity.available || !/^\\d{15}$/.test(imei)) {
					valueElement.textContent = 'Not available';
					toast('No valid 15-digit IMEI was returned by the router modem cache.', 'warning');
					return;
				}
				const age = Number(identity.cache_age_seconds);
				const freshness = Number.isInteger(age) && age >= 0 ? ` · cached ${age}s ago` : ' · cache age unknown';
				valueElement.textContent = imei + freshness + (identity.stale ? ' (stale)' : '');
				imeiButton.textContent = 'Hide IMEI';
				imeiVisible = true;
				clearTimeout(identityHideTimer);
				identityHideTimer = setTimeout(() => {
					valueElement.textContent = 'Hidden';
					imeiButton.textContent = 'Show IMEI';
					imeiVisible = false;
				}, 60000);
			} catch (error) {
				toast(error.message || 'Could not read the modem IMEI.', 'error');
			} finally {
				setBusy(imeiButton, false);
				if (imeiVisible) imeiButton.textContent = 'Hide IMEI';
			}
		});

		const reconnect = root.querySelector('#cellular-reconnect');
		reconnect?.addEventListener('click', async () => {
			const ok = await confirm({
				title: 'Reconnect mobile data?',
				message: 'The cellular data session will be restarted. Internet access may drop briefly.',
				confirmLabel: 'Reconnect'
			});
			if (!ok) return;
			setBusy(reconnect, true, 'Reconnecting…');
			try {
				await api.cellularAction('reconnect');
				toast('Cellular reconnect requested.', 'success');
				setTimeout(() => this.render({ api, root, toast, confirm }), 1800);
			} catch (error) {
				toast(error.message || 'Reconnect failed.', 'error');
			} finally {
				setBusy(reconnect, false);
			}
		});

		const switchButton = root.querySelector('#cellular-switch-sim');
		switchButton?.addEventListener('click', async () => {
			const current = Number(status.sim) === 2 ? 2 : 1;
			const next = current === 1 ? 2 : 1;
			const ok = await confirm({
				title: `Switch to SIM ${next}?`,
				message:
					'The modem will change SIM and reconnect. This can interrupt Internet access for a short period.',
				confirmLabel: `Use SIM ${next}`
			});
			if (!ok) return;
			setBusy(switchButton, true, 'Switching…');
			try {
				await api.cellularAction('switchSim', { sim: next });
				toast(`Switch to SIM ${next} requested.`, 'success');
				setTimeout(() => this.render({ api, root, toast, confirm }), 2500);
			} catch (error) {
				toast(error.message || 'SIM switch failed.', 'error');
			} finally {
				setBusy(switchButton, false);
			}
		});
	}
};
