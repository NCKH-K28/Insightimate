// // scripts/deps-usage-scan.ts
// import fs from 'node:fs/promises';
// import path from 'node:path';
// import ts from 'typescript';

// type Hit = { file: string; spec: string };

// const ROOT = process.cwd();

// const IGNORE_DIRS = new Set([
//   'node_modules',
//   '.next',
//   'dist',
//   'build',
//   'coverage',
//   '.git',
//   '.turbo',
//   '.cache',
//   '.vercel',
//   '.output',
// ]);

// const EXT_OK = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);

// function isScoped(spec: string) {
//   return spec.startsWith('@');
// }

// function pkgNameFromSpecifier(spec: string): string | null {
//   if (!spec) return null;
//   if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) return null;
//   // ignore URL imports
//   if (/^https?:\/\//.test(spec)) return null;

//   // e.g. "@scope/name/path" -> "@scope/name"
//   if (isScoped(spec)) {
//     const parts = spec.split('/');
//     if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
//     return spec;
//   }

//   // e.g. "lodash/fp" -> "lodash"
//   return spec.split('/')[0];
// }

// async function walk(dir: string, out: string[] = []) {
//   const entries = await fs.readdir(dir, { withFileTypes: true });
//   for (const ent of entries) {
//     if (ent.isDirectory()) {
//       if (IGNORE_DIRS.has(ent.name)) continue;
//       await walk(path.join(dir, ent.name), out);
//     } else if (ent.isFile()) {
//       const ext = path.extname(ent.name);
//       if (EXT_OK.has(ext)) out.push(path.join(dir, ent.name));
//     }
//   }
//   return out;
// }

// function parseFile(sourceText: string, fileName: string) {
//   // ScriptKind inferred by filename helps TS parse TS/JS properly
//   const sf = ts.createSourceFile(
//     fileName,
//     sourceText,
//     ts.ScriptTarget.Latest,
//     true,
//     ts.ScriptKind.TSX,
//   );

//   const specs: string[] = [];

//   function addModuleSpecifier(ms: ts.Expression | undefined) {
//     if (!ms) return;
//     if (ts.isStringLiteral(ms)) specs.push(ms.text);
//     // Template strings like import(`pkg/${x}`) can't be resolved safely
//   }

//   function visit(node: ts.Node) {
//     // import ... from "x"
//     if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
//       const ms = (node as ts.ImportDeclaration | ts.ExportDeclaration).moduleSpecifier;
//       addModuleSpecifier(ms as any);
//     }

//     // require("x")
//     if (ts.isCallExpression(node)) {
//       const callee = node.expression;

//       // require("x")
//       if (ts.isIdentifier(callee) && callee.text === 'require') {
//         const [arg] = node.arguments;
//         addModuleSpecifier(arg);
//       }

//       // import("x") dynamic import
//       if (callee.kind === ts.SyntaxKind.ImportKeyword) {
//         const [arg] = node.arguments;
//         addModuleSpecifier(arg);
//       }
//     }

//     ts.forEachChild(node, visit);
//   }

//   visit(sf);
//   return specs;
// }

// async function main() {
//   const pkgJsonPath = path.join(ROOT, 'package.json');
//   const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8')) as {
//     dependencies?: Record<string, string>;
//     devDependencies?: Record<string, string>;
//     peerDependencies?: Record<string, string>;
//   };

//   const deps = {
//     ...(pkg.dependencies ?? {}),
//     ...(pkg.devDependencies ?? {}),
//     ...(pkg.peerDependencies ?? {}),
//   };

//   const depNames = Object.keys(deps);

//   const hits = new Map<string, Hit[]>();
//   for (const name of depNames) hits.set(name, []);

//   const files = await walk(path.join(ROOT, 'src'))
//     .catch(() => [])
//     .then((x) => x);

//   // also scan common non-src entrypoints (workers/scripts/config)
//   const extraRoots = ['workers', 'scripts'].map((p) => path.join(ROOT, p));
//   for (const r of extraRoots) {
//     try {
//       const more = await walk(r);
//       files.push(...more);
//     } catch {
//       // ignore missing folders
//     }
//   }

//   // also scan root-level configs that often contain requires
//   const rootFiles = await fs.readdir(ROOT, { withFileTypes: true });
//   for (const ent of rootFiles) {
//     if (!ent.isFile()) continue;
//     const ext = path.extname(ent.name);
//     if (EXT_OK.has(ext) || ent.name.endsWith('.config.ts') || ent.name.endsWith('.config.js')) {
//       files.push(path.join(ROOT, ent.name));
//     }
//     if (
//       ent.name.startsWith('next.config.') ||
//       ent.name.startsWith('tailwind.config.') ||
//       ent.name.startsWith('postcss.config.') ||
//       ent.name.startsWith('vitest.config.') ||
//       ent.name.startsWith('eslint.config.')
//     ) {
//       files.push(path.join(ROOT, ent.name));
//     }
//   }

//   // De-dup
//   const uniqFiles = Array.from(new Set(files));

//   for (const file of uniqFiles) {
//     let text: string;
//     try {
//       text = await fs.readFile(file, 'utf8');
//     } catch {
//       continue;
//     }

//     const specs = parseFile(text, file);

//     for (const spec of specs) {
//       const depName = pkgNameFromSpecifier(spec);
//       if (!depName) continue;
//       if (!hits.has(depName)) continue;

//       hits.get(depName)!.push({
//         file: path.relative(ROOT, file),
//         spec,
//       });
//     }
//   }

//   const unused: string[] = [];
//   const used: Array<{ name: string; count: number; examples: Hit[] }> = [];

//   for (const name of depNames.sort()) {
//     const arr = hits.get(name) ?? [];
//     if (arr.length === 0) unused.push(name);
//     else used.push({ name, count: arr.length, examples: arr.slice(0, 5) });
//   }

//   // Output
//   console.log('=== Used dependencies (top examples) ===');
//   for (const u of used.sort((a, b) => b.count - a.count)) {
//     console.log(`\n- ${u.name}  (hits: ${u.count})`);
//     for (const ex of u.examples) console.log(`  • ${ex.file}  <- "${ex.spec}"`);
//   }

//   console.log('\n=== Unused (no static import/require found) ===');
//   for (const name of unused) console.log(`- ${name}`);

//   // Helpful: write JSON for diffing with knip output
//   const outPath = path.join(ROOT, 'deps-usage-scan.json');
//   await fs.writeFile(
//     outPath,
//     JSON.stringify(
//       {
//         used: used.map((u) => ({ name: u.name, count: u.count, examples: u.examples })),
//         unused,
//       },
//       null,
//       2,
//     ),
//     'utf8',
//   );
//   console.log(`\nWrote: ${path.relative(ROOT, outPath)}`);
// }

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });
