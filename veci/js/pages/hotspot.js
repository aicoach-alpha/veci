import { badge, escapeHtml } from '../lib/dom.js';

const modules = {
	guest: { path: '/veci-apps/guest.js', name: 'Guest portal' },
	voucher: { path: '/veci-apps/voucher.js', name: 'Voucher' }
};

export default {
	id: 'hotspot',
	title: 'Hotspot',
	eyebrow: 'GUEST ACCESS',
	icon: 'wifi',
	async render({ api, root, toast, confirm }) {
		const [guest, voucher] = await Promise.all([
			api.call('veci.app.guest', 'status', {}).catch(() => null),
			api.call('veci.app.voucher', 'status', {}).catch(() => null)
		]);
		const guestInstalled = guest !== null;
		const voucherInstalled = voucher !== null;
		const count = Array.isArray(voucher?.vouchers) ? voucher.vouchers.length : 0;
		root.innerHTML = `
      <div class="page-intro"><div><h2>Hotspot & vouchers</h2>
      <p>Manage a dedicated guest network and time-limited credentials using the native VeCI guest and voucher apps.</p></div>
      ${badge(guest?.enabled ? 'Guest portal active' : 'Guest portal inactive', guest?.enabled ? 'success' : 'neutral')}</div>
      <div class="content-grid content-grid-2">
      <section class="panel">
        <div class="panel-heading"><div><p class="eyebrow">GUEST NETWORK</p><h3>Captive portal</h3></div>
        ${badge(guestInstalled ? 'Installed' : 'Not installed', guestInstalled ? 'success' : 'neutral')}</div>
        <div class="detail-list">
          <div><span>Network</span><strong>${escapeHtml(guest?.ssid || 'Not configured')}</strong></div>
          <div><span>Portal</span><strong>${guest?.enabled ? 'Enabled' : 'Disabled'}</strong></div>
          <div><span>Authentication</span><strong>${guest?.auth_mode === 'credentials' ? 'Voucher credentials' : 'Click to continue / unavailable'}</strong></div>
        </div>
        ${guestInstalled ? '<button class="button button-primary" type="button" data-hotspot-module="guest">Manage guest portal</button>' : '<a class="button button-secondary" href="#/apps" data-route="apps">Install Guest app</a>'}
      </section>
      <section class="panel">
        <div class="panel-heading"><div><p class="eyebrow">VOUCHERS</p><h3>Guest credentials</h3></div>
        ${badge(voucherInstalled ? 'Installed' : 'Not installed', voucherInstalled ? 'success' : 'neutral')}</div>
        <div class="detail-list">
          <div><span>Active vouchers</span><strong>${count}</strong></div>
          <div><span>Guest ready</span><strong>${voucher?.guest_ready ? 'Yes' : 'No'}</strong></div>
        </div>
        ${voucherInstalled ? '<button class="button button-primary" type="button" data-hotspot-module="voucher">Manage vouchers</button>' : '<a class="button button-secondary" href="#/apps" data-route="apps">Install Voucher app</a>'}
      </section></div>
      <div class="notice-card"><strong>Guest isolation and access control</strong>
      <p>Guest portal and vouchers use the firmware's supported uspot integration. Provisioning or enabling the guest network can reload Wi-Fi, DHCP and firewall services. Do not activate it without checking access recovery.</p></div>
    `;
		root.querySelectorAll('[data-hotspot-module]').forEach(button => {
			button.addEventListener('click', async () => {
				const key = button.dataset.hotspotModule;
				const moduleInfo = modules[key];
				if (!moduleInfo) return;
				button.disabled = true;
				try {
					const imported = await import(moduleInfo.path);
					if (typeof imported.default?.render !== 'function') throw new Error('App module unavailable');
					root.innerHTML = '';
					await imported.default.render({
						api,
						root,
						toast,
						confirm,
						app: { name: moduleInfo.name },
						back: () => this.render({ api, root, toast, confirm })
					});
				} catch (error) {
					toast(error.message || 'Unable to open hotspot module', 'error');
					this.render({ api, root, toast, confirm });
				}
			});
		});
	}
};
