const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const clone = value => JSON.parse(JSON.stringify(value));

const state = {
	rootPasswordSet: false,
	board: {
		kernel: '6.12.94',
		hostname: 'VeCI-Demo',
		system: 'MediaTek MT7628AN ver:1 eco:2',
		model: 'Zbtlink ZBT-WE5927',
		board_name: 'zbtlink,zbt-we5927',
		release: {
			distribution: 'OpenWrt',
			version: '25.12.5',
			revision: 'r33051-f5dae5ece4',
			target: 'ramips/mt76x8',
			description: 'OpenWrt 25.12.5 r33051-f5dae5ece4'
		}
	},
	system: {
		localtime: 1791346200,
		uptime: 183742,
		load: [734, 812, 699],
		memory: {
			total: 61460480,
			free: 14352384,
			shared: 192512,
			buffered: 1282048,
			available: 28680192,
			cached: 13303808
		},
		swap: { total: 0, free: 0 }
	},
	interfaces: [
		{
			interface: 'loopback',
			up: true,
			proto: 'static',
			device: 'lo',
			l3_device: 'lo',
			'ipv4-address': [{ address: '127.0.0.1', mask: 8 }],
			route: []
		},
		{
			interface: 'lan',
			up: true,
			proto: 'static',
			device: 'br-lan',
			l3_device: 'br-lan',
			'ipv4-address': [{ address: '192.168.1.1', mask: 24 }],
			route: [{ target: '192.168.1.0', mask: 24 }]
		},
		{
			interface: 'wan',
			up: false,
			proto: 'dhcp',
			device: 'eth0.2',
			l3_device: 'eth0.2',
			'ipv4-address': [],
			route: []
		},
		{
			interface: 'lte',
			up: true,
			proto: 'dhcp',
			device: 'usb0',
			l3_device: 'usb0',
			'ipv4-address': [{ address: '192.168.7.109', mask: 24 }],
			route: [{ target: '0.0.0.0', mask: 0, nexthop: '192.168.7.1' }],
			dns_server: ['94.140.14.14', '94.140.15.15']
		}
	],
	wirelessRuntime: {
		radio0: {
			up: true,
			pending: false,
			autostart: true,
			disabled: false,
			config: { channel: '1', htmode: 'HT20', country: 'ID' },
			interfaces: [
				{
					section: 'default_radio0',
					ifname: 'phy0-ap0',
					config: { mode: 'ap', ssid: 'WIFI-Alpha', encryption: 'sae-mixed', network: ['lan'] }
				},
				{
					section: 'guest_radio0',
					ifname: 'phy0-ap1',
					config: { mode: 'ap', ssid: 'VeCI-Guest', encryption: 'sae-mixed', network: ['guest'] }
				}
			]
		}
	},
	uci: {
		network: {
			lan: { '.type': 'interface', proto: 'static', device: 'br-lan', ipaddr: '192.168.1.1', netmask: '255.255.255.0' },
			wan: { '.type': 'interface', proto: 'dhcp', device: 'eth0.2', peerdns: '1' },
			lte: { '.type': 'interface', proto: 'dhcp', device: 'usb0', metric: '5', peerdns: '0', dns: ['94.140.14.14', '94.140.15.15'] }
		},
		wireless: {
			radio0: {
				'.type': 'wifi-device',
				type: 'mac80211',
				path: 'platform/10300000.wmac',
				band: '2g',
				channel: '1',
				htmode: 'HT20',
				country: 'ID',
				cell_density: '2',
				legacy_rates: '0'
			},
			default_radio0: {
				'.type': 'wifi-iface',
				device: 'radio0',
				mode: 'ap',
				network: ['lan'],
				ssid: 'WIFI-Alpha',
				encryption: 'sae-mixed',
				key: 'demo-key-present',
				hidden: '0',
				isolate: '0',
				disabled: '0'
			},
			guest_radio0: {
				'.type': 'wifi-iface',
				device: 'radio0',
				mode: 'ap',
				network: ['guest'],
				ssid: 'VeCI-Guest',
				encryption: 'sae-mixed',
				key: 'demo-key-present',
				hidden: '0',
				isolate: '1',
				disabled: '0'
			}
		},
		dhcp: {
			lan: { '.type': 'dhcp', interface: 'lan', start: '100', limit: '150', leasetime: '12h' },
			printer: { '.type': 'host', name: 'Office-Printer', mac: 'aa:10:2c:91:11:20', ip: '192.168.1.120' }
		},
		firewall: {
			defaults: { '.type': 'defaults', input: 'REJECT', output: 'ACCEPT', forward: 'REJECT' },
			lan: {
				'.type': 'zone',
				name: 'lan',
				network: ['lan'],
				input: 'ACCEPT',
				output: 'ACCEPT',
				forward: 'ACCEPT'
			},
			wan: {
				'.type': 'zone',
				name: 'wan',
				network: ['wan', 'lte'],
				input: 'REJECT',
				output: 'ACCEPT',
				forward: 'REJECT',
				masq: '1',
				mtu_fix: '1'
			},
			guest: {
				'.type': 'zone',
				name: 'guest',
				network: ['guest'],
				input: 'REJECT',
				output: 'ACCEPT',
				forward: 'REJECT'
			},
			allow_dhcp: {
				'.type': 'rule',
				name: 'Allow-DHCP-Renew',
				src: 'wan',
				proto: 'udp',
				dest_port: '68',
				target: 'ACCEPT'
			},
			guest_dns: {
				'.type': 'rule',
				name: 'Guest-DNS',
				src: 'guest',
				proto: ['tcp', 'udp'],
				dest_port: '53',
				target: 'ACCEPT'
			},
			demo_redirect: {
				'.type': 'redirect',
				name: 'Demo HTTPS service',
				src: 'wan',
				src_dport: '8443',
				dest: 'lan',
				dest_ip: '192.168.1.20',
				dest_port: '443',
				proto: 'tcp'
			}
		}
	},
	clients: [
		{ hostname: 'Andre-Laptop', ipaddr: '192.168.1.101', macaddr: 'AA:10:2C:91:11:01', expires: 2481 },
		{ hostname: 'Rere-iPhone', ipaddr: '192.168.1.108', macaddr: 'AA:10:2C:91:11:08', expires: 3120 },
		{ hostname: 'Living-Room-TV', ipaddr: '192.168.1.112', macaddr: 'AA:10:2C:91:11:12', expires: 2190 },
		{ hostname: 'Office-Printer', ipaddr: '192.168.1.120', macaddr: 'AA:10:2C:91:11:20', expires: 3510 },
		{ hostname: 'Guest-Phone', ipaddr: '192.168.20.103', macaddr: 'AA:20:2C:91:20:03', expires: 1470 },
		{ hostname: 'Tablet', ipaddr: '192.168.1.131', macaddr: 'AA:10:2C:91:11:31', expires: 2740 }
	]
};

function findInterface(name) {
	return state.interfaces.find(iface => iface.interface === name);
}

function mergeValues(target, values = {}) {
	for (const [key, value] of Object.entries(values)) target[key] = value;
}

export class VeciApi {
	constructor() {
		this.sessionId = 'veci-demo-session';
		this.demoMode = true;
	}

	async request() {
		await wait(70);
		return [0, {}];
	}

	async login() {
		await wait(160);
		this.sessionId = 'veci-demo-session';
		return this.sessionId;
	}

	async validateSession() {
		return true;
	}

	async logout() {
		this.sessionId = '';
	}

	clearSession() {
		this.sessionId = '';
	}

	async call(object, method, params = {}) {
		await wait(60);
		if (object === 'system' && method === 'board') return this.board();
		if (object === 'system' && method === 'info') return this.systemInfo();
		if (object === 'system' && method === 'reboot') return { demo: true };
		if (object === 'network.interface' && method === 'dump') return this.interfaces();
		if (object.startsWith('network.interface.') && ['up', 'down'].includes(method)) {
			return this.interfaceAction(object.replace('network.interface.', ''), method);
		}
		if (object === 'network.wireless' && method === 'status') return this.wirelessStatus();
		if (object === 'uci' && method === 'get') return this.uciGet(params.config, params.section || null);
		if (object === 'uci' && method === 'set') return this.uciSet(params.config, params.section, params.values || {});
		if (object === 'uci' && method === 'add') return this.uciAdd(params.config, params.type, params.values || {}, params.name || null);
		if (object === 'uci' && method === 'delete') return this.uciDelete(params.config, params.section, params.option || null);
		if (object === 'uci' && method === 'commit') return this.uciCommit(params.config);
		if (object === 'veci.cellular') return this.cellularAction(method, params);
		if (object === 'veci') return this.veci(method, params);
		return {};
	}

	async board() {
		return clone(state.board);
	}

	async systemInfo() {
		return clone(state.system);
	}

	async interfaces() {
		return { interface: clone(state.interfaces) };
	}

	async wirelessStatus() {
		return clone(state.wirelessRuntime);
	}

	async interfaceStatus(name) {
		return clone(findInterface(name) || {});
	}

	async interfaceAction(name, action) {
		const iface = findInterface(name);
		if (iface) iface.up = action === 'up';
		return { demo: true, interface: name, action };
	}

	async uciGet(config, section = null) {
		const values = state.uci[config] || {};
		if (!section) return { values: clone(values) };
		return { values: { [section]: clone(values[section] || {}) } };
	}

	async uciAdd(config, type, values = {}, name = null) {
		state.uci[config] ||= {};
		const section = name || `cfg${Math.random().toString(16).slice(2, 8)}`;
		state.uci[config][section] = { '.type': type, ...clone(values) };
		return { section, demo: true };
	}

	async uciSet(config, section, values) {
		state.uci[config] ||= {};
		state.uci[config][section] ||= { '.type': config === 'wireless' ? 'wifi-iface' : 'section' };
		mergeValues(state.uci[config][section], values);

		if (config === 'wireless') {
			for (const radio of Object.values(state.wirelessRuntime)) {
				const runtime = radio.interfaces?.find(iface => iface.section === section);
				if (runtime) {
					mergeValues(runtime.config, values);
					if ('disabled' in values) radio.up = String(values.disabled) !== '1';
				}
			}
		}
		return { demo: true };
	}

	async uciDelete(config, section, option = null) {
		const values = state.uci[config] || {};
		if (!option) delete values[section];
		else if (values[section]) delete values[section][option];
		return { demo: true };
	}

	async uciCommit() {
		return { demo: true };
	}

	async cellularStatus() {
		await wait(50);
		return {
			enabled: true,
			online: true,
			mode: 'RNDIS',
			data_interface: 'usb0',
			ipv4: '192.168.7.109/24',
			gateway: '192.168.7.1',
			sim: 1,
			manufacturer: 'Demo Cellular',
			model: 'CX07E-class modem',
			revision: 'demo',
			sim_status: 'READY',
			operator: 'Mobile Network',
			access_tech: 'LTE',
			registration_status: 'Registered',
			packet_status: 'Attached',
			signal_percent: 78,
			signal_dbm: -79
		};
	}

	async cellularAction(method, params = {}) {
		if (method === 'status') return this.cellularStatus();
		if (method === 'reconnect') return { demo: true, ok: true };
		if (method === 'switchSim') return { demo: true, ok: true, sim: params.sim || 1 };
		return { demo: true };
	}

	async veci(method, params = {}) {
		await wait(50);
		if (method === 'setAdminPassword') {
			if (state.rootPasswordSet) return { ok: false, error: 'password_already_set', demo: true };
			state.rootPasswordSet = true;
			return { ok: true, demo: true };
		}
		if (method === 'diagnostic') {
			const target = params.target || '1.1.1.1';
			if (params.tool === 'traceroute') {
				return { ok: true, tool: 'traceroute', target, output: `traceroute to ${target} (simulated)\n 1  192.168.1.1  0.8 ms\n 2  192.168.7.1  4.2 ms\n 3  10.20.0.1  11.6 ms\n 4  ${target}  22.4 ms` };
			}
			return { ok: true, tool: 'ping', target, output: `PING ${target} (simulated)\n64 bytes from ${target}: seq=0 ttl=56 time=21.8 ms\n64 bytes from ${target}: seq=1 ttl=56 time=22.1 ms\n64 bytes from ${target}: seq=2 ttl=56 time=21.5 ms\n64 bytes from ${target}: seq=3 ttl=56 time=22.0 ms\n\n4 packets transmitted, 4 received, 0% packet loss` };
		}
		const responses = {
			capabilities: {
				opennds: true,
				sqm: false,
				ddns: true,
				wireguard: true,
				voucher: true,
				cellular: true
			},
			clients: { clients: clone(state.clients) },
			networkInventory: {
				bridges: [
					{ name: 'br-lan', members: ['eth0.1', 'phy0-ap0'] },
					{ name: 'br-guest', members: ['phy0-ap1'] }
				],
				ports: ['eth0', 'usb0', 'phy0-ap0', 'phy0-ap1']
			},
			health: {
				overlay: '1.2 MB free of 2.1 MB',
				temperature: '56°C',
				load: '0.18'
			},
			securityStatus: { root_password_set: state.rootPasswordSet },
			wifiReload: { demo: true, reloaded: true },
			serviceAction: { demo: true }
		};
		return clone(responses[method] || { demo: true });
	}
}
