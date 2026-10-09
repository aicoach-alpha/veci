import { badge, escapeHtml, setBusy } from '../lib/dom.js';

const fallbackApps = {
	opennds: ['Guest portal', 'Captive portal engine'],
	sqm: ['Smart Queue', 'Queue management'],
	ddns: ['Dynamic DNS', 'Hostname updates'],
	wireguard: ['WireGuard', 'VPN capability'],
	voucher: ['Voucher', 'Time-limited guest access']
};

function fallbackCatalog(capabilities) {
	return Object.entries(fallbackApps).map(([id, [name, description]]) => ({
		id,
		name,
		description,
		tier: '',
		installed: Boolean(capabilities[id]),
		installable: false,
		removable: false,
		packages: []
	}));
}

export default {
	id: 'apps',
	title: 'Apps',
	eyebrow: 'EXTENSIONS',
	icon: 'apps',

	async render({ api, root, toast, confirm }) {
		const load = async () => {
			const [capabilities, catalog, updateStatus] = await Promise.all([
				api.veci('capabilities').catch(() => ({})),
				api.veci('apps', {}, { timeout: 10000 }).catch(() => ({ apps: [] })),
				api.veci('updateStatus', {}, { timeout: 10000 }).catch(() => ({}))
			]);
			return {
				capabilities,
				catalog,
				updateStatus,
				apps: Array.isArray(catalog.apps) && catalog.apps.length ? catalog.apps : fallbackCatalog(capabilities)
			};
		};

		let state = await load();

		const draw = () => {
			const feedEnabled = Boolean(state.catalog.feed_enabled);
			const manager = state.catalog.package_manager || 'unknown';
			const kernelFeedMismatch = Boolean(state.updateStatus.kernel_feed_mismatch);

			root.innerHTML = `
				<div class="page-intro">
					<div>
						<h2>Router apps</h2>
						<p>Optional capabilities stay outside VeCI Core. Only catalogued packages from the router's compatible package source can be managed here.</p>
					</div>
				</div>
				<div class="app-grid">
					${state.apps
						.map(app => {
							const installed = Boolean(app.installed);
							const installable = Boolean(app.installable);
							const removable = Boolean(app.removable);
							const status = installed
								? badge('Installed', 'success')
								: installable
									? badge('Ready to install', 'info')
									: badge('Not installed', 'neutral');
							const action =
								installed && removable
									? `<button class="button button-secondary" data-app-action="remove" data-app-id="${escapeHtml(app.id)}" type="button">Remove</button>`
									: !installed && installable
										? `<button class="button button-primary" data-app-action="install" data-app-id="${escapeHtml(app.id)}" type="button">Install</button>`
										: '';
							return `
								<article class="app-card">
									<div class="app-card-icon">${escapeHtml((app.name || app.id || '?').slice(0, 1))}</div>
									<div class="app-card-copy">
										<div class="app-card-title"><h3>${escapeHtml(app.name || app.id || 'App')}</h3>${status}</div>
										<p>${escapeHtml(app.description || '')}</p>
										${app.tier ? `<p class="muted">Resource tier ${escapeHtml(app.tier)}</p>` : ''}
										${action ? `<div class="app-card-actions">${action}</div>` : ''}
									</div>
								</article>
							`;
						})
						.join('')}
				</div>
				<div class="notice-card">
					<strong>${feedEnabled ? 'VeCI app feed is enabled.' : 'VeCI app feed is disabled.'}</strong>
					<p>${
						kernelFeedMismatch
							? 'Kernel ABI mismatch detected. Kernel-dependent apps remain blocked until the exact VeCI-matched feed is configured.'
							: feedEnabled
								? `Package manager: ${escapeHtml(manager)}. Install actions are restricted to root-owned app manifests on this router.`
								: 'Install actions stay locked until a compatible signed feed is configured by the firmware profile.'
					}</p>
				</div>
			`;

			root.querySelectorAll('[data-app-action]').forEach(button => {
				button.addEventListener('click', async () => {
					const id = button.dataset.appId;
					const action = button.dataset.appAction;
					const app = state.apps.find(item => item.id === id);
					if (!app) return;

					const allowed = await confirm({
						title: action === 'install' ? `Install ${app.name}?` : `Remove ${app.name}?`,
						message:
							action === 'install'
								? 'VeCI will install only the packages declared by the router app manifest.'
								: 'The selected app packages will be removed. Core firmware packages are not part of this action.',
						confirmLabel: action === 'install' ? 'Install app' : 'Remove app',
						tone: action === 'install' ? 'primary' : 'danger'
					});
					if (!allowed) return;

					setBusy(button, true, action === 'install' ? 'Installing…' : 'Removing…');
					try {
						const result = await api.veci('appAction', { id, action }, { timeout: 120000 });
						if (!result.ok) throw new Error(result.error || 'App action failed');
						state = await load();
						draw();
						toast(action === 'install' ? `${app.name} installed.` : `${app.name} removed.`, 'success');
					} catch (error) {
						toast(error.message || 'Could not change router app state.', 'error');
						setBusy(button, false);
					}
				});
			});
		};

		draw();
	}
};