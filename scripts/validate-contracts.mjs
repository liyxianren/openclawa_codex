import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { glob } from 'glob';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const schemaPaths = {
  plan: path.join(root, 'schemas/plan-bundle.schema.json'),
  latest: path.join(root, 'schemas/latest.schema.json'),
  verify: path.join(root, 'schemas/verify.schema.json')
};

async function readJson(p) {
  const raw = await fs.readFile(p, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON: ${p}: ${e.message}`);
  }
}

function formatErrors(errors = []) {
  return errors.map(e => {
    const loc = e.instancePath || '(root)';
    return `- ${loc} ${e.message}`;
  }).join('\n');
}

async function main() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);

  const planSchema = await readJson(schemaPaths.plan);
  const latestSchema = await readJson(schemaPaths.latest);
  const verifySchema = await readJson(schemaPaths.verify);

  const validatePlan = ajv.compile(planSchema);
  const validateLatest = ajv.compile(latestSchema);
  const validateVerify = ajv.compile(verifySchema);

  const files = [
    // Only validate contract JSON files (plan/latest/verify). Ignore other JSON artifacts (e.g. schemas).
    ...(await glob(path.join(root, 'examples/**/*plan*.json'))),
    ...(await glob(path.join(root, 'examples/**/*latest*.json'))),
    ...(await glob(path.join(root, 'examples/**/*verify*.json'))),
    ...(await glob(path.join(root, 'demo/artifacts/**/*plan*.json'))),
    ...(await glob(path.join(root, 'demo/artifacts/**/*latest*.json'))),
    ...(await glob(path.join(root, 'demo/artifacts/**/*verify*.json')))
  ];

  if (files.length === 0) {
    console.log('No JSON files found under examples/ or demo/artifacts/.');
    return;
  }

  function cloneErrors(errors) {
    if (!errors) return [];
    return errors.map(e => ({ ...e }));
  }

  function detectKind(filePath) {
    const p = filePath.toLowerCase();
    // Prefer explicit tokens in filename; fall back to path includes.
    const base = path.basename(p);
    if (/\bplan\b|plan-bundle|plan_bundle/.test(base) || /\/plan\b/.test(p)) return 'plan';
    if (/\blatest\b/.test(base) || /\/latest\b/.test(p)) return 'latest';
    if (/\bverify\b/.test(base) || /\/verify\b/.test(p)) return 'verify';
    return null;
  }

  function validateOne(kind, obj) {
    if (kind === 'plan') return { kind, ok: validatePlan(obj), errors: cloneErrors(validatePlan.errors) };
    if (kind === 'latest') return { kind, ok: validateLatest(obj), errors: cloneErrors(validateLatest.errors) };
    if (kind === 'verify') return { kind, ok: validateVerify(obj), errors: cloneErrors(validateVerify.errors) };
    throw new Error(`Unknown kind: ${kind}`);
  }

  let failed = 0;
  for (const f of files) {
    const obj = await readJson(f);

    const kind = detectKind(f);
    const attempts = [];
    const candidates = kind ? [kind] : ['verify', 'latest', 'plan'];

    for (const k of candidates) {
      const r = validateOne(k, obj);
      attempts.push(r);
      if (r.ok) break;
    }

    const ok = attempts.some(a => a.ok);

    if (!ok) {
      failed++;
      // Choose the most informative error set (heuristic: fewest errors).
      const best = attempts.reduce((acc, cur) => {
        if (!acc) return cur;
        return (cur.errors.length < acc.errors.length) ? cur : acc;
      }, null);

      const tried = attempts.map(a => a.kind).join(', ');
      const header = best ? `Tried: ${tried}; best match: ${best.kind} (${best.errors.length} errors)` : `Tried: ${tried}`;
      console.error(`\n[FAIL] ${path.relative(root, f)}\n${header}\n${formatErrors(best?.errors || [])}`);
    } else {
      console.log(`[OK]   ${path.relative(root, f)}`);
    }
  }

  if (failed > 0) {
    console.error(`\nValidation failed for ${failed} file(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll contract JSON validated successfully.');
  }
}

main().catch(err => {
  console.error(err.stack || err.message || String(err));
  process.exitCode = 1;
});
