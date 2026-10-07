import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { minify } from 'terser';
import CleanCSS from 'clean-css';

const sourceRoot = 'veci';
const distRoot = 'dist/veci';

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(full)));
		else files.push(full);
	}
	return files;
}

async function writeOutput(source, data) {
	const rel = relative(sourceRoot, source);
	const target = join(distRoot, rel);
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, data);
	return target;
}

async function buildJavaScript(file) {
	const input = await readFile(file, 'utf8');
	const result = await minify(input, {
		module: true,
		compress: {
			dead_code: true,
			drop_debugger: true,
			passes: 2
		},
		mangle: { toplevel: true },
		format: { comments: false }
	});
	if (!result.code) throw new Error(`Unable to minify ${file}`);
	const target = await writeOutput(file, result.code);
	console.log(`JS  ${file} -> ${target}`);
}

async function buildCss(file) {
	const input = await readFile(file, 'utf8');
	const result = new CleanCSS({ level: 2 }).minify(input);
	if (result.errors.length) throw new Error(result.errors.join('\n'));
	const target = await writeOutput(file, result.styles);
	console.log(`CSS ${file} -> ${target}`);
}

async function build() {
	await rm(distRoot, { recursive: true, force: true });
	await mkdir(distRoot, { recursive: true });

	const files = await walk(sourceRoot);
	for (const file of files) {
		if (file.endsWith('.js')) await buildJavaScript(file);
		else if (file.endsWith('.css')) await buildCss(file);
		else {
			const target = join(distRoot, relative(sourceRoot, file));
			await mkdir(dirname(target), { recursive: true });
			await cp(file, target);
		}
	}

	console.log(`VeCI bundle complete: ${distRoot}`);
}

build().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
