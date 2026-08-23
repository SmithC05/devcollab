/**
 * knowledgeAdapter.js
 * 
 * Simulates a backend GenAI knowledge transfer service.
 * In a production system, this would call a real backend LLM endpoint.
 * This adapter adheres strictly to the contract specified in Phase 6.
 */

// Mock delay helper
const delay = (ms) => new Promise(res => setTimeout(res, ms));

export async function fetchKnowledgeTransfer(scenarioId, sourceEngineer, receivingEngineer, task, project, simulationImpact) {
  // Simulate network delay and LLM generation time
  await delay(1500);

  // Return structured mock matching the Phase 6 contract
  return {
    status: 'GENERATED', // NOT_STARTED | COLLECTING_EVIDENCE | GENERATING | DRAFT | REVIEW | APPROVED | TRANSFERRED | FAILED
    source: 'SYNTHETIC_DEMO',
    sourceEngineer,
    receivingEngineer,
    task,
    project,
    simulationImpact: {
      beforeEffort: simulationImpact?.before || 6.8,
      afterEffort: simulationImpact?.after || 4.4,
      reduction: simulationImpact?.reduction || 2.4
    },
    coverage: {
      architecture: true,
      importantFiles: true,
      currentState: true,
      knownIssues: true,
      dependencies: true,
      debuggingGuidance: true,
      recentDecisions: true,
      testing: true,
      deployment: false
    },
    sections: [
      {
        id: 'architecture',
        title: 'Architecture',
        status: 'COMPLETE',
        summary: 'Payment API handles transaction requests and connects to Gateway service via gRPC.',
        evidence: 'System design doc & recent PRs',
        provenance: 'DERIVED',
        content: 'The Payment API sits behind the main API gateway. It authenticates requests via the Auth module, then forwards normalized payloads to the external Gateway service. The retry logic is implemented at the RPC boundary.'
      },
      {
        id: 'currentState',
        title: 'Current Implementation State',
        status: 'COMPLETE',
        summary: 'Retry logic is implemented but occasionally causes cascading timeouts.',
        evidence: 'Recent commits & active branch',
        provenance: 'REAL_DB',
        content: 'Smith recently added exponential backoff to the `gateway_client.ts`. However, under high load, the backoff jitter isn\'t enough to prevent thundering herds on the external gateway.'
      },
      {
        id: 'importantFiles',
        title: 'Important Files',
        status: 'COMPLETE',
        summary: 'payments/service.ts, payments/controller.ts, gateway/client.ts',
        evidence: 'Git history on this issue',
        provenance: 'DERIVED',
        content: 'Focus primarily on `gateway/client.ts` for the retry loop logic. `payments/service.ts` contains the domain logic mapping internal states to gateway states.'
      },
      {
        id: 'knownIssues',
        title: 'Known Issues',
        status: 'COMPLETE',
        summary: 'Gateway timeout behavior under retry conditions.',
        evidence: 'Jira issue #PAY-1042',
        provenance: 'REAL_DB',
        content: 'If the external gateway drops the connection mid-flight, the retry interceptor sometimes duplicates the POST payload. This is the core issue that needs fixing.'
      },
      {
        id: 'dependencies',
        title: 'Dependencies',
        status: 'COMPLETE',
        summary: 'Relies on Auth API and external Stripe/Braintree gateway.',
        evidence: 'package.json & internal docs',
        provenance: 'REAL_DB',
        content: 'Ensure you have valid sandbox credentials for Stripe in your `.env` before attempting to reproduce.'
      },
      {
        id: 'debuggingGuidance',
        title: 'Debugging Path',
        status: 'COMPLETE',
        summary: 'Steps to reproduce the timeout locally.',
        evidence: 'Synthesized from Slack history',
        provenance: 'DERIVED',
        content: '1. Start the API locally.\n2. Use Toxiproxy to simulate a 5000ms latency on the Gateway port.\n3. Send a bulk transaction payload.\n4. Observe the worker queue filling up.'
      },
      {
        id: 'recentDecisions',
        title: 'Recent Decisions',
        status: 'COMPLETE',
        summary: 'Moved from synchronous REST to async queue processing.',
        evidence: 'Architecture Decision Record 12',
        provenance: 'REAL_DB',
        content: 'Smith decided last week to move the processing to a Redis-backed async queue to avoid blocking the main HTTP thread during gateway delays.'
      },
      {
        id: 'testing',
        title: 'Testing Guidance',
        status: 'COMPLETE',
        summary: 'Unit tests available, but need an integration test for the queue.',
        evidence: 'Test coverage report',
        provenance: 'DERIVED',
        content: 'Run `npm run test:payments`. You will need to write a new integration test using the mocked Gateway server in `tests/mocks/gateway_server.js`.'
      },
      {
        id: 'deployment',
        title: 'Deployment Guidance',
        status: 'NOT_AVAILABLE',
        summary: 'Not available in current engineering evidence.',
        evidence: 'None',
        provenance: 'REAL_DB',
        content: null
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      quality: 'STRONG', // STRONG | GOOD | PARTIAL | INCOMPLETE
      model: 'gemini-1.5-pro'
    }
  };
}
