import { $, build } from "bun";
import { rm } from "node:fs/promises";

const clear_dist = () => rm("dist", { recursive: true, force: true });

const build_ts = () =>
	build({
		target: "node",
		minify: true,
		entrypoints: ["lib/index.ts"],
		outdir: "dist",
		packages: "external",
		sourcemap: "inline",
	});

const build_types = () => $`tsc -p .`;

clear_dist()
	.then(() => console.log("Cleared dist directory"))
	.then(build_ts)
	.then(() => console.log("typescript build done"))
	.then(build_types)
	.then(() => console.log("types build done"))
	.catch(console.error);
