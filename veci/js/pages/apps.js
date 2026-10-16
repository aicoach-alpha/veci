import { badge, setBusy } from '../lib/dom.js';

const APPS = Object.freeze({
  guest: ['Guest portal', 'Captive portal engine', 'opennds'],
  sqm: ['Smart Queue', 'Queue management', 'sqm'],
  ddns: ['Dynamic DNS', 'Hostname updates', 'ddns'],
  wireguard: ['WireGuard', 'VPN capability', 'wireguard'],
  voucher: ['Voucher', 'Time-limited guest access', 'voucher']
});

function node(doc, tag, cls, text) {
  const el = doc.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

export default {
  id: 'apps',
  title: 'Apps',
  eyebrow: 'EXTENSIONS',
  icon: 'apps',

  async render({ api, root, toast, confirm }) {
    const [capabilities, result] = await Promise.all([
      api.veci('capabilities').catch(() => ({})),
      api.call('veci.apps', 'status', {}, { timeout: 8000 }).catch(() => null)
    ]);
    const report = result?.schema === 1 ? result : null;
    const managed = report?.management_available === true;
    const ready = managed && report?.feed_ready === true;
    const doc = root.ownerDocument;
    root.replaceChildren();
    const intro = node(doc, 'div', 'page-intro');
    const introText = node(doc, 'div');
    introText.append(node(doc, 'h2', '', 'Router apps'),
      node(doc, 'p', '', 'Install optional capabilities individually, subject to storage and signed firmware-matched packages.'));
    intro.append(introText);
    root.append(intro);
    const grid = node(doc, 'div', 'app-grid');
    for (const [id, [label, detail, cap]] of Object.entries(APPS)) {
      const item = report?.apps?.[id];
      const installed = typeof item?.installed === 'boolean'
        ? item.installed : capabilities?.[cap] === true;
      const card = node(doc, 'article', 'app-card');
      const initial = node(doc, 'div', 'app-card-icon', label[0]);
      const copy = node(doc, 'div', 'app-card-copy');
      const title = node(doc, 'div', 'app-card-title');
      title.append(node(doc, 'h3', '', label));
      const status = node(doc, 'span');
      status.innerHTML = badge(installed ? 'Installed' : 'Not installed', installed ? 'success' : 'neutral');
      title.append(status);
      copy.append(title, node(doc, 'p', '', detail));
      const canInstall = ready && !installed && item?.available === true;
      const canRemove = managed && installed && item?.managed === true;
      if (canInstall || canRemove) {
        const action = canInstall ? 'install' : 'remove';
        const button = node(doc, 'button', 'button button-secondary', canInstall ? 'Install' : 'Uninstall');
        button.type = 'button';
        button.addEventListener('click', async () => {
          const permitted = await confirm({
            title: (canInstall ? 'Install ' : 'Uninstall ') + label + '?',
            message: 'This changes router packages. Confirm only if you understand that available storage and network services may be affected.',
            confirmLabel: canInstall ? 'Install app' : 'Uninstall app',
            tone: canRemove ? 'danger' : undefined
          });
          if (!permitted) return;
          setBusy(button, true, canInstall ? 'Installing…' : 'Removing…');
          try {
            const outcome = await api.call('veci.apps', action, { id }, { timeout: 120000 });
            if (outcome?.ok !== true) throw Error(outcome?.reason || 'package_operation_failed');
            toast('App package operation completed.', 'success');
            await this.render({ api, root, toast, confirm });
          } catch (error) {
            toast(error.message || 'Package operation failed.', 'error');
            setBusy(button, false);
          }
        });
        copy.append(button);
      }
      card.append(initial, copy);
      grid.append(card);
    }
    root.append(grid);
    const notice = node(doc, 'div', 'notice-card');
    const heading = ready ? 'VeCI app repository ready'
      : 'App installation currently unavailable';
    const text = !managed ? 'The VeCI Apps management backend is not installed.'
      : !ready ? 'The matching signed package feed is not configured. Install buttons remain unavailable until a verified release is published.'
      : 'Apps are installed individually. VeCI will check the available overlay space before making changes.';
    notice.append(node(doc, 'strong', '', heading), node(doc, 'p', '', text));
    root.append(notice);
  }
};
