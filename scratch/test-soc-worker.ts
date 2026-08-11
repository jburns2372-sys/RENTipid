const { runDetectionEvaluationCycle } = require('../src/lib/security/rules/evaluator-worker.service');

async function testWorker() {
  console.log("Starting SOC Evaluator Worker...");
  try {
    let result = await runDetectionEvaluationCycle();
    console.log("Cycle 1:", result);
    
    // Run another cycle to clear backlog if needed
    if (result.success && result.nextRuleCursor) {
      result = await runDetectionEvaluationCycle({ ruleCursor: result.nextRuleCursor });
      console.log("Cycle 2:", result);
    }
  } catch (error) {
    console.error("Worker Error:", error);
  }
}

testWorker();
