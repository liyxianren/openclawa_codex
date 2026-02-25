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
    ...(await glob(path.join(root, 'examples/**/*.json'))),
    ...(await glob(path.join(root, 'demo/artifacts/**/*.json')))
  ];

  if (files.length === 0) {
    console.log('No JSON files found under examples/ or demo/artifacts/.');
    return;
  }

  let failed = 0;
  for (const f of files) {
    const obj = await readJson(f);

    let ok = true;
    if (f.includes('plan')) ok = validatePlan(obj);
    else if (f.includes('latest')) ok = validateLatest(obj);
    else if (f.includes('verify')) ok = validateVerify(obj);
    else {
      // default: try best-effort (verify then latest then plan)
      ok = validateVerify(obj) || validateLatest(obj) || validatePlan(obj);
    }

    if (!ok) {
      failed++;
      const errs = validatePlan.errors || validateLatest.errors || validateVerify.errors;
      console.error(`\n[FAIL] ${path.relative(root, f)}\n${formatErrors(errs)}`);
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
