import { badge, escapeHtml } from '../lib/dom.js';
const catalogLabels = {
 opennds: ['Guest portal', 'Captive portal engine'],
 sqm: ['Smart Queue', 'Bandwidth management'],
 ddns: ['Dynamic DNS', 'Hostname updates'],
 wireguard: ['WireGuard', 'VPN tools'],
 adblock: ['DNS filter', 'Network ad blocking'],
 wol: ['Wake-on-LAN', 'Wake LAN devices']
};
export default {
 id: 'apps', title: 'Apps', eyebrow: 'EXTENSIONS', icon: 'apps',
 async render({api, root}) {
  let catalog;
  try { catalog = await api.veci('appCatalog'); }
  catch { root.innerHTML = '<div class="notice-card">Package status unavailable; no changes made.</div>'; return; }
  const apps = Array.isArray(catalog.apps) ? catalog.apps : [];
  root.innerHTML = `<div class="page-intro"><div><h2>Router apps</h2><p>Package state verified on this device.</p></div></div>
    <div class="notice-card">Free overlay: ${Number(catalog.freeOverlayKB || 0).toLocaleString()} KB. Installation and removal remain disabled until compatibility checks pass.</div>
    <div class="app-grid">${apps.map(item => {
      const details = catalogLabels[item.id]; if (!details) return '';
      const [name, description] = details;
      return `<article class="app-card"><div class="app-card-icon">${escapeHtml(name[0])}</div><div class="app-card-copy"><div class="app-card-title"><h3>${escapeHtml(name)}</h3>${badge(item.installed ? 'Installed' : 'Not installed', item.installed ? 'success' : 'neutral')}</div><p>${escapeHtml(description)}</p><p>Package: ${escapeHtml(item.package || '')}</p></div></article>`;
    }).join('')}</div>`;
 }
};
