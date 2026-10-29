import { badge, escapeHtml } from '../lib/dom.js';
import { generateVoucherCsv } from '../lib/voucher.js';
export default {
	id: 'hotspot',
	title: 'Hotspot',
	eyebrow: 'GUEST ACCESS',
	icon: 'wifi',
	async render({ api, root, toast }) {
		const capability = await api.veci('capabilities').catch(() => ({}));
		const service = await api.veci('hotspotStatus').catch(() => null);
		const ndsInstalled = Boolean(service?.installed ?? capability.opennds);
		const active = service?.running === true;
		root.innerHTML = `<div class="page-intro"><div><h2>Hotspot & vouchers</h2>
      <p>Guest captive portal based on openNDS. Generate a voucher roll compatible with openNDS ThemeSpec.</p></div>
      ${badge(ndsInstalled ? (active ? 'Portal running' : 'Installed, not running') : 'Portal not installed', active ? 'success' : 'neutral')}</div>
      <section class="panel">
        <div class="panel-heading"><div><p class="eyebrow">PORTAL</p><h3>Integration status</h3></div></div>
        <div class="detail-list"><div><span>openNDS</span><strong>${ndsInstalled ? 'Installed' : 'Not installed'}</strong></div>
        <div><span>Service</span><strong>${active ? 'Running' : 'Not running / not verified'}</strong></div>
        <div><span>Voucher provider</span><strong>${capability.voucher ? 'Exposed' : 'Not available'}</strong></div></div>
        <p class="panel-copy">Voucher CSV export does not activate accounts. Install and configure the verified openNDS voucher ThemeSpec and import the roll before customers can log in.</p>
      </section>
      <section class="panel">
        <div class="panel-heading"><div><p class="eyebrow">VOUCHER ROLL</p><h3>Generate secure access codes</h3></div></div>
        <form id="voucher-generator" class="diagnostic-form">
          <label class="field"><span>Count (1–100)</span><input name="count" type="number" min="1" max="100" value="10" required /></label>
          <label class="field"><span>Duration (minutes)</span><input name="minutes" type="number" min="1" max="43200" value="60" required /></label>
          <label class="field"><span>Download rate (kb/s, 0 = unlimited)</span><input name="downloadKbps" type="number" min="0" max="100000" value="2000" required /></label>
          <label class="field"><span>Upload rate (kb/s, 0 = unlimited)</span><input name="uploadKbps" type="number" min="0" max="100000" value="1000" required /></label>
          <label class="field"><span>Download quota (MiB, 0 = unlimited)</span><input name="downloadMiB" type="number" min="0" max="102400" value="0" required /></label>
          <label class="field"><span>Upload quota (MiB, 0 = unlimited)</span><input name="uploadMiB" type="number" min="0" max="102400" value="0" required /></label>
          <button class="button button-primary" type="submit">Export voucher CSV</button>
        </form>
        <p class="panel-copy">Codes are generated locally using cryptographically secure random bytes. The file is private: it contains unused voucher credentials. Store it securely, and do not keep an active voucher roll on flash where every login rewrites it.</p>
      </section>`;
		root.querySelector('#voucher-generator').addEventListener('submit', event => {
			event.preventDefault();
			const form = event.currentTarget;
			const data = new FormData(form);
			try {
				const n = key => Number(data.get(key));
				const csv = generateVoucherCsv({
					count: n('count'),
					minutes: n('minutes'),
					downloadKbps: n('downloadKbps'),
					uploadKbps: n('uploadKbps'),
					downloadKiB: n('downloadMiB') * 1024,
					uploadKiB: n('uploadMiB') * 1024
				});
				const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
				const link = document.createElement('a');
				link.href = href;
				link.download = 'veci-vouchers.csv';
				document.body.appendChild(link);
				link.click();
				link.remove();
				setTimeout(() => URL.revokeObjectURL(href), 5000);
				toast('Voucher roll exported. Import to a configured openNDS portal before use.', 'success');
			} catch (error) {
				toast(escapeHtml(error.message || 'Voucher generation failed'), 'error');
			}
		});
	}
};
