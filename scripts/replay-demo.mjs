import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const artifactsDir = path.join(root, 'demo', 'artifacts');

async function readJson(rel) {
  const p = path.join(artifactsDir, rel);
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

function printTitle(t) {
  console.log(`\n=== ${t} ===`);
}

async function main() {
  printTitle('Scenario: fail → fix → pass (contract replay)');

  const plan = await readJson('plan-bundle.demo.json');
  console.log('Plan Bundle:', { task_name: plan.task_name, workdir: plan.workdir });

  const latest1 = await readJson('latest.demo.1.json');
  console.log('Runner status #1:', { status: latest1.status, summary: latest1.summary });

  const verifyFail = await readJson('verify.demo.fail.json');
  console.log('Verify #1:', {
    verify_status: verifyFail.verify_status,
    fail_kind: verifyFail.fail_kind,
    fail_summary: verifyFail.fail_summary
  });

  const latest2 = await readJson('latest.demo.2.json');
  console.log('Runner status #2:', { status: latest2.status, summary: latest2.summary });

  const verifyPass = await readJson('verify.demo.pass.json');
  console.log('Verify #2:', { verify_status: verifyPass.verify_status });

  console.log('\nReplay complete (this demo does not require OpenClaw/Codex; it replays the contract artifacts).');
}

main().catch(err => {
  console.error(err.stack || err.message || String(err));
  process.exitCode = 1;
});
