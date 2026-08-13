import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { OATRegistry } from '../../src/lib/oat/oat-module-registry';
import { assertSafeOatEnvironment } from '../../src/lib/oat/oat-environment-guard';

// Import modules to register them
import '../../src/lib/oat/modules/social-oat';
import '../../src/lib/oat/modules/ai-oat';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetModule = args[1]; // optional

  if (!command) {
    console.error('Usage: tsx oat-runner.ts <list|check|setup|reset> [module|all]');
    process.exit(1);
  }

  // To prevent any accidental executions, verify the environment first.
  if (command !== 'list') {
      try {
          assertSafeOatEnvironment();
      } catch (err: any) {
          console.error(err.message);
          process.exit(1);
      }
  }

  switch (command) {
    case 'list':
      listModules();
      break;
    case 'check':
    case 'all:check':
      await checkModules(command === 'all:check' ? 'all' : targetModule);
      break;
    case 'setup':
      await setupModule(targetModule);
      break;
    case 'reset':
    case 'all:reset':
      await resetModules(command === 'all:reset' ? 'all' : targetModule);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

function listModules() {
  const modules = OATRegistry.getAll();
  console.log(`Registered OAT Modules: ${modules.length}`);
  modules.forEach(m => {
    console.log(`- [${m.enabled ? 'ENABLED' : 'DISABLED'}] ${m.moduleId} (${m.oatId}) - ${m.criticality}`);
  });
}

async function checkModules(target: string | undefined) {
    const modules = target === 'all' || !target 
        ? OATRegistry.getEnabled() 
        : [OATRegistry.get(target)].filter(Boolean);

    if (modules.length === 0) {
        console.error('No modules found to check.');
        process.exit(1);
    }

    for (const m of modules) {
        if (!m) continue;
        console.log(`\nChecking readiness for ${m.moduleId}...`);
        try {
            const result = await m.readinessHandler();
            console.log(`MODULE:\n${m.moduleName}\n`);
            console.log(`OAT ID:\n${m.oatId}\n`);
            console.log(`ENVIRONMENT:\n${result.environment}\n`);
            console.log(`DATABASE:\n${result.database}\n`);
            console.log(`FIXTURES:\n${result.fixtures}\n`);
            console.log(`DEPENDENCIES:\n${result.dependencies}\n`);
            console.log(`RBAC:\n${result.rbac}\n`);
            console.log(`MOCK/SANDBOX PROVIDER:\n${result.mockProvider}\n`);
            console.log(`FEATURE FLAGS:\n${result.featureFlags}\n`);
            console.log(`BLOCKERS:\n${result.blockers.length === 0 ? 'NONE' : result.blockers.join(', ')}\n`);
            console.log(`OVERALL:\n${result.overall}\n`);
        } catch (err: any) {
            console.error(`Error checking readiness for ${m.moduleId}:`, err.message);
        }
    }
}

async function setupModule(target: string | undefined) {
    if (!target) {
        console.error('Please specify a module ID to setup. Example: setup SOCIAL');
        process.exit(1);
    }

    const m = OATRegistry.get(target);
    if (!m) {
        console.error(`Module ${target} not found.`);
        process.exit(1);
    }

    console.log(`Setting up fixtures for ${m.moduleId} (${m.oatId})...`);
    try {
        await m.fixtureProvider();
        console.log(`Setup complete for ${m.moduleId}.`);
    } catch (err: any) {
        console.error(`Error during setup for ${m.moduleId}:`, err.message);
    }
}

async function resetModules(target: string | undefined) {
    const modules = target === 'all' || !target 
        ? OATRegistry.getEnabled() 
        : [OATRegistry.get(target)].filter(Boolean);

    if (modules.length === 0) {
        console.error('No modules found to reset.');
        process.exit(1);
    }

    for (const m of modules) {
        if (!m) continue;
        console.log(`Resetting transient data for ${m.moduleId}...`);
        try {
            await m.resetHandler();
            console.log(`Reset complete for ${m.moduleId}.`);
        } catch (err: any) {
            console.error(`Error during reset for ${m.moduleId}:`, err.message);
        }
    }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
