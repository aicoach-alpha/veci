import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'veci');
const port = Number(process.env.PORT || 8080);
const contentTypes = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml'
};

createServer((request, response) => {
	const rawPath = request.url?.split('?')[0] || '/';
	const relativePath = rawPath === '/' ? 'index.html' : rawPath.replace(/^\/+/, '');
	const safePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
	const file = join(root, safePath);

	try {
		if (!statSync(file).isFile()) throw new Error('not a file');
		response.writeHead(200, {
			'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
			'Cache-Control': 'no-store'
		});
		createReadStream(file).pipe(response);
	} catch {
		response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end('Not found');
	}
}).listen(port, '127.0.0.1', () => {
	console.log(`VeCI source server: http://127.0.0.1:${port}/`);
	console.log('Router ubus calls require deployment to an OpenWrt device.');
});
