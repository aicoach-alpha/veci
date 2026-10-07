import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const site = 'dist/demo-site';

await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp('dist/veci', site, { recursive: true });
await cp('demo/api.js', join(site, 'js/lib/api.js'));
await cp('demo/demo.css', join(site, 'demo.css'));

const indexPath = join(site, 'index.html');
let html = await readFile(indexPath, 'utf8');
html = html
	.replace('</head>', '\t\t<link rel="stylesheet" href="./demo.css" />\n\t</head>')
	.replace(
		'<body>',
		'<body>\n\t\t<div class="demo-badge" aria-label="Interactive demo using simulated data"><strong>VeCI Interactive Demo</strong><span>Simulated data · changes are not saved</span></div>'
	);
await writeFile(indexPath, html);
await writeFile(join(site, '.nojekyll'), '');
console.log(`VeCI demo site complete: ${site}`);
