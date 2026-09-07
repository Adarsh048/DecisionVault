import 'fake-indexeddb/auto';
import { useDecisionStore, INITIAL_DECISIONS } from '../store/decisionStore';

console.log('Testing Clean Decision Vault Flow...');

// 1. Verify INITIAL_DECISIONS is empty
console.log('Initial decisions length:', INITIAL_DECISIONS.length);
if (INITIAL_DECISIONS.length !== 0) {
  throw new Error('FAILED: INITIAL_DECISIONS must be empty!');
}

// 2. Clear store to test clean slate
useDecisionStore.getState().clearAllDecisions();
console.log('Store decisions after clear:', useDecisionStore.getState().decisions.length);
if (useDecisionStore.getState().decisions.length !== 0) {
  throw new Error('FAILED: decisions must be empty after clear!');
}

// 3. Add first brand-new decision
const firstDecision = useDecisionStore.getState().addDecision({
  title: 'Adopt SQLite WASM for Edge Persistence',
  status: 'proposed',
  team: 'Platform Engineering',
  tags: ['Database', 'SQLite', 'Edge'],
  context: 'We need lightweight transactional persistence at the browser edge.',
  decision: 'Use official SQLite WASM distribution with OPFS backing.',
  consequences: 'Enables complex local SQL queries with zero cloud egress cost.',
  author: {
    id: 'u-1',
    name: 'Sarah Chen',
    email: 'admin@decisionvault.io',
    role: 'Owner & Lead Architect',
  },
});

console.log('\n--- First User Decision Created ---');
console.log('ID:', firstDecision.id);
console.log('Number:', firstDecision.number);
console.log('Title:', firstDecision.title);

if (firstDecision.number !== 1) {
  throw new Error(`FAILED: First new decision must be ADR-001, got: ${firstDecision.number}`);
}

// 4. Add second brand-new decision
const secondDecision = useDecisionStore.getState().addDecision({
  title: 'Establish Schema Validation with Zod 3.x',
  status: 'accepted',
  team: 'Core Platform',
  tags: ['Validation', 'TypeScript'],
  context: 'Inconsistent data payloads across microservices lead to silent runtime bugs.',
  decision: 'Standardize on Zod schemas for all inbound and outbound REST/WebSocket payloads.',
  consequences: 'Guarantees runtime type safety across services.',
  author: {
    id: 'u-2',
    name: 'Alex Rivera',
    email: 'alex@decisionvault.io',
    role: 'Senior Full-Stack Engineer',
  },
});

console.log('\n--- Second User Decision Created ---');
console.log('ID:', secondDecision.id);
console.log('Number:', secondDecision.number);
console.log('Title:', secondDecision.title);

if (secondDecision.number !== 2) {
  throw new Error(`FAILED: Second new decision must be ADR-002, got: ${secondDecision.number}`);
}

// Check that new decisions CANNOT be submitted as accepted or deprecated directly
console.log('Second decision status upon creation:', secondDecision.status);
if (secondDecision.status === 'accepted' || secondDecision.status === 'deprecated') {
  throw new Error(`FAILED: New decision must not be accepted or deprecated upon creation, got: ${secondDecision.status}`);
}
if (secondDecision.status !== 'proposed') {
  throw new Error(`FAILED: New decision must default to 'proposed', got: ${secondDecision.status}`);
}

// 5. Test Voting: Check that users can vote 'up' or 'down' and voter options are tracked
console.log('\n--- Testing Voter Tracking and Options ---');
useDecisionStore.getState().voteDecision(firstDecision.id, 'down', {
  userId: 'u-3',
  userName: 'Marcus Vance',
  userEmail: 'marcus@decisionvault.io',
  userRole: 'Security Principal',
});

const updatedFirst = useDecisionStore.getState().decisions.find((d) => d.id === firstDecision.id);
console.log('First decision voters count:', updatedFirst?.votes.voters?.length);
console.log('First decision up votes:', updatedFirst?.votes.up);
console.log('First decision down votes:', updatedFirst?.votes.down);

if (!updatedFirst?.votes.voters || updatedFirst.votes.voters.length < 2) {
  throw new Error('FAILED: Expected at least 2 voters tracked on ADR-001');
}

const marcusVote = updatedFirst.votes.voters.find((v) => v.userName === 'Marcus Vance');
if (!marcusVote || marcusVote.option !== 'down') {
  throw new Error(`FAILED: Marcus Vance must have option 'down', got: ${marcusVote?.option}`);
}

const authorVote = updatedFirst.votes.voters.find((v) => v.userName === 'Sarah Chen');
if (!authorVote || authorVote.option !== 'up') {
  throw new Error(`FAILED: Sarah Chen must have option 'up', got: ${authorVote?.option}`);
}

console.log('Verified voter breakdown:');
for (const voter of updatedFirst.votes.voters) {
  console.log(`  - ${voter.userName} (${voter.userRole}): ${voter.option.toUpperCase()} at ${voter.votedAt}`);
}

// 6. Verify only newly created decisions are present
const currentList = useDecisionStore.getState().decisions;
console.log('\nTotal decisions present in store:', currentList.length);
if (currentList.length !== 2) {
  throw new Error(`FAILED: Expected exactly 2 decisions, got: ${currentList.length}`);
}

const legacyIds = ['dec-1', 'dec-2', 'dec-3', 'dec-4', 'dec-5'];
for (const legacyId of legacyIds) {
  if (currentList.some((d) => d.id === legacyId)) {
    throw new Error(`FAILED: Legacy seed ${legacyId} should not exist in decisions!`);
  }
}

console.log('\n✅ ALL CLEAN DECISION VAULT & VOTING TESTS PASSED PERFECTLY!');
