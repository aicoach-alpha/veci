import { badge, escapeHtml, setBusy } from '../lib/dom.js';
import { firstAddress, humanProtocol } from '../lib/format.js';

export default {
	id: 'network',
	title: 'Network',
	eyebrow: 'ADVANCED NETWORKING',
	icon: 'network',

	async render({ api, root, toast, confirm, navigate }) {
		const [interfacesResult, inventory, ipv6Policy] = await Promise.all([
			api.interfaces(),
			api.veci('networkInventory').catch(() => ({ bridges: [], ports: [] })),
			api.veci('ipv6Status').catch(() => null)
		]);
		const interfaces = interfacesResult.interface || [];


		const ipv6Available = ipv6Policy?.ok === true;
		const ipv6Panel = ipv6Available
			? `
			<section class="panel" id="ipv6-settings">
				<div class="panel-heading"><div><p class="eyebrow">NETWORK SETTINGS</p><h3>IPv6</h3></div>
					<span id="ipv6-runtime" class="count-pill">${escapeHtml(ipv6Policy.runtime || 'unknown')}</span></div>
				<p class="panel-copy">IPv6 is off by default on new VeCI installations. This switch saves the next-boot setting only: it will not restart Wi-Fi, LTE, or your current Internet connection.</p>
				<form id="ipv6-policy-form" class="inline-setting-form">
					<label class="field"><span>IPv6 mode</span><select id="ipv6-mode">
						<option value="off" ${ipv6Policy.desiredEnabled ? '' : 'selected'}>Off (IPv4 only)</option>
						<option value="on" ${ipv6Policy.desiredEnabled ? 'selected' : ''}>On (dual-stack if supported)</option>
					</select></label>
					<button class="button button-primary" type="submit" id="ipv6-save">Save for next restart</button>
				</form>
				<p class="panel-copy" id="ipv6-note">${ipv6Policy.legacyConflict ? 'Legacy IPv4-only policy is installed. Enabling IPv6 requires a separate compatibility migration.' : ipv6Policy.pendingReboot ? 'Change pending next router restart.' : ipv6Policy.managed ? 'Configured mode active.' : 'Existing configuration is preserved until you choose a mode.'}</p>
			</section>`
			: `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">NETWORK SETTINGS</p><h3>IPv6</h3></div></div><p class="panel-copy">IPv6 management is unavailable on this firmware build. Existing networking remains unchanged.</p></section>`;

		root.innerHTML = `
			<div class="page-intro">
				<div><h2>Network layout</h2><p>Interfaces, bridges, physical ports and IPv6 settings in one place.</p></div>
				<button class="button button-secondary" id="network-devices" type="button">Connected devices</button>
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

			${ipv6Panel}
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

			<section class="panel diagnostic-panel">
				<div class="panel-heading">
					<div><p class="eyebrow">DIAGNOSTICS</p><h3>Test connectivity</h3></div>
				</div>
				<form id="diagnostic-form" class="diagnostic-form">
					<label class="field">
						<span>Tool</span>
						<select id="diagnostic-tool">
							<option value="ping">Ping</option>
							<option value="traceroute">Traceroute</option>
						</select>
					</label>
					<label class="field diagnostic-target">
						<span>Host or IP address</span>
						<input id="diagnostic-host" type="text" value="1.1.1.1" maxlength="253" autocomplete="off" required />
					</label>
					<button id="diagnostic-run" class="button button-primary diagnostic-run" type="submit">Run test</button>
				</form>
				<pre id="diagnostic-output" class="diagnostic-output hidden" aria-live="polite"></pre>
			</section>
		`;


		root.querySelector('#network-devices')?.addEventListener('click', () => navigate('devices'));
		const ipv6Form = root.querySelector('#ipv6-policy-form');
		ipv6Form?.addEventListener('submit', async event => {
			event.preventDefault();
			const enabled = root.querySelector('#ipv6-mode').value === 'on';
			const allowed = await confirm({
				title: enabled ? 'Enable IPv6 after next restart?' : 'Disable IPv6 after next restart?',
				message: 'The new mode will be saved now, without interrupting Wi-Fi or LTE. It takes effect when the router is next restarted. IPv6 Internet access depends on modem and operator support.',
				confirmLabel: 'Save setting'
			});
			if (!allowed) return;
			const save = root.querySelector('#ipv6-save');
			setBusy(save, true, 'Saving…');
			try {
				const result = await api.veci('ipv6Configure', { enabled });
				if (result?.ok !== true) {
					throw new Error(result?.error || 'Could not save IPv6 mode');
				}
				root.querySelector('#ipv6-note').textContent =
					result.pendingReboot ? 'Change saved; it will take effect on the next router restart.' : 'IPv6 mode saved; no network restart was performed.';
				toast('IPv6 setting saved without interrupting the current connection.', 'success');
			} catch (error) {
				toast(error.message || 'Could not save IPv6 mode.', 'error');
			} finally {
				setBusy(save, false);
			}
		});

		const form = root.querySelector('#diagnostic-form');
		const runButton = root.querySelector('#diagnostic-run');
		const output = root.querySelector('#diagnostic-output');

		form?.addEventListener('submit', async event => {
			event.preventDefault();
			const tool = root.querySelector('#diagnostic-tool').value;
			const target = root.querySelector('#diagnostic-host').value.trim();

			if (!/^[A-Za-z0-9._:-]+$/.test(target)) {
				toast('Use a hostname or IP address without spaces or URL paths.', 'error');
				return;
			}

			setBusy(runButton, true, 'Running…');
			output.classList.remove('hidden');
			output.textContent = `Running ${tool} for ${target}…`;

			try {
				const result = await api.veci('diagnostic', { tool, target });
				if (result.ok === false) throw new Error(result.error || 'Diagnostic failed');
				output.textContent = result.output || 'No output returned.';
			} catch (error) {
				output.textContent = error.message || 'Diagnostic failed.';
				toast(error.message || 'Diagnostic failed.', 'error');
			} finally {
				setBusy(runButton, false);
			}
		});
	}
};
