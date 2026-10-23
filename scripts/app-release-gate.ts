import { runCommand } from './address-local-common';

async function main(): Promise<void> {
  console.log('RENTipid application release gate');
  await runCommand('npx', ['tsx', 'scripts/app-verify.ts', 'local']);
  await runCommand('npx', ['tsx', 'scripts/app-verify.ts', 'preview']);
  await runCommand('npx', ['tsx', 'scripts/app-verify.ts', 'production-readiness']);
  console.log('APP_RELEASE_GATE = PASS');
}

main().catch((error: unknown) => {
  console.error('APP_RELEASE_GATE = NOT_READY');
  console.error(error instanceof Error ? error.message : 'Release gate stopped safely.');
  process.exitCode = 1;
});
