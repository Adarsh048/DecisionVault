import { useUserApprovalStore } from '@/store/userApprovalStore';
import { useAuthStore } from '@/store/authStore';

console.log('Testing User Approval & Role Welcome Dialogue Box Flow...');

const testEmail = 'new-engineer@decisionvault.io';
const testName = 'Devon Vance';

// 1. Set user as pending
useUserApprovalStore.getState().addPendingUser(testName, testEmail);
const pending = useUserApprovalStore.getState().approvals.find((a) => a.email === testEmail);
console.log('User added to pending approval:', pending?.name, pending?.email, 'status:', pending?.status);

if (!pending) {
  throw new Error('FAILED: Pending user not found in approvals store!');
}

// 2. Owner approves Devon Vance as an Engineer ('member') in 'Platform Engineering'
console.log('\n--- Owner Approves User ---');
await useUserApprovalStore.getState().approveUser(pending.id, 'member', 'Platform Engineering', 'Sarah Chen (Owner)');

const remainingPending = useUserApprovalStore.getState().approvals.find((a) => a.email === testEmail);
const approvedRecord = useUserApprovalStore.getState().approvedRecords.find((a) => a.email === testEmail);

console.log('Pending entry removed:', !remainingPending);
console.log('Approved Record saved:', approvedRecord?.name, 'Role:', approvedRecord?.role, 'Team:', approvedRecord?.team, 'Welcomed:', approvedRecord?.welcomed);

if (remainingPending) {
  throw new Error('FAILED: User should be removed from pending approvals!');
}
if (!approvedRecord || approvedRecord.role !== 'member' || approvedRecord.team !== 'Platform Engineering') {
  throw new Error('FAILED: Approved record missing or incorrect!');
}

// 3. User logs in as Devon Vance (active)
console.log('\n--- Devon Vance Logs In ---');
useAuthStore.getState().setUser({
  _id: 'u-devon',
  name: testName,
  email: testEmail,
  role: 'member',
  membershipStatus: 'active',
  organizations: ['org-1'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Check and trigger welcome dialog
useUserApprovalStore.getState().checkAndTriggerWelcome(testEmail);
const activeDialog = useUserApprovalStore.getState().activeWelcomeDialog;

console.log('Active Welcome Dialog is present:', Boolean(activeDialog));
console.log('Dialog User Name:', activeDialog?.name);
console.log('Dialog Assigned Role:', activeDialog?.role);
console.log('Dialog Assigned Team:', activeDialog?.team);
console.log('Dialog Reviewer:', activeDialog?.reviewedBy);

if (!activeDialog) {
  throw new Error('FAILED: activeWelcomeDialog should be set for approved user upon login!');
}
if (activeDialog.role !== 'member') {
  throw new Error('FAILED: Assigned role in dialog should be member!');
}

// 4. User dismisses / clicks Get Started
console.log('\n--- User Clicks Explore My Workspace / Dismiss ---');
useUserApprovalStore.getState().dismissWelcomeDialog();

const activeDialogAfter = useUserApprovalStore.getState().activeWelcomeDialog;
const updatedApproved = useUserApprovalStore.getState().approvedRecords.find((a) => a.email === testEmail);

console.log('Active Dialog after dismiss is null:', activeDialogAfter === null);
console.log('Approved record marked welcomed:', updatedApproved?.welcomed === true);

if (activeDialogAfter !== null) {
  throw new Error('FAILED: activeWelcomeDialog should be null after dismiss!');
}
if (!updatedApproved?.welcomed) {
  throw new Error('FAILED: Approved record should be marked welcomed: true!');
}

// 5. Subsequent check for Devon Vance: should NOT trigger again (strictly 1 time only)
console.log('\n--- Verify Devon Vance does NOT see dialog repeatedly ---');
useUserApprovalStore.getState().checkAndTriggerWelcome(testEmail);
if (useUserApprovalStore.getState().activeWelcomeDialog !== null) {
  throw new Error('FAILED: Should not trigger dialog again after being welcomed once!');
}
console.log('Repeated check result: activeWelcomeDialog is null (PASSED)');

// 6. Existing user (Sarah Chen / Owner): should NEVER see dialog
console.log('\n--- Verify existing users (Owner / Sarah Chen) NEVER see dialog ---');
useUserApprovalStore.getState().checkAndTriggerWelcome('admin@decisionvault.io');
if (useUserApprovalStore.getState().activeWelcomeDialog !== null) {
  throw new Error('FAILED: Existing non-applicant users should NEVER get the dialog!');
}
console.log('Existing user check result: activeWelcomeDialog is null (PASSED)');

// 7. Test 1-click test simulation
console.log('\n--- Test 1-Click Simulation ---');
useUserApprovalStore.getState().simulateApprovalWelcome('member', 'Core Architecture');
const simulated = useUserApprovalStore.getState().activeWelcomeDialog;
console.log('Simulated Welcome Dialog triggered:', Boolean(simulated), 'Role:', simulated?.role, 'Team:', simulated?.team);

if (!simulated || simulated.role !== 'member' || simulated.team !== 'Core Architecture') {
  throw new Error('FAILED: simulateApprovalWelcome failed!');
}

useUserApprovalStore.getState().dismissWelcomeDialog();

console.log('\n✅ ALL USER APPROVAL WELCOME DIALOGUE TESTS PASSED PERFECTLY!');
