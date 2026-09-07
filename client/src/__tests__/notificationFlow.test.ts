import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

console.log('Testing Notification Store & Proposal Dialogue Box Logic...');

// 1. Set current user as Engineer Alex Rivera
useAuthStore.getState().setUser({
  _id: 'u-2',
  name: 'Alex Rivera',
  email: 'alex@decisionvault.io',
  role: 'member' as any,
  membershipStatus: 'active',
  organizations: ['org-1'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

console.log('Current user set to Engineer:', useAuthStore.getState().user?.name, useAuthStore.getState().user?.email);

// Clear initial notifications for test clarity
useNotificationStore.getState().clearAll();
console.log('Unread count after clear:', useNotificationStore.getState().unreadCount);

// 2. Simulate Owner Sarah Chen proposing a new decision
console.log('\n--- Simulating Owner Proposal ---');
const ownerProposalNotif = useNotificationStore.getState().simulateOwnerProposal();

console.log('Created Notification ID:', ownerProposalNotif.id);
console.log('Title:', ownerProposalNotif.title);
console.log('Message:', ownerProposalNotif.message);
console.log('Is Owner Proposal:', ownerProposalNotif.isOwnerProposal);

// 3. Verify that for Engineer Alex Rivera, activeProposalDialog and activeToast are populated!
const activeDialog = useNotificationStore.getState().activeProposalDialog;
const activeToast = useNotificationStore.getState().activeToast;
const unreadCount = useNotificationStore.getState().unreadCount;

console.log('\n--- Dialogue Box & Alert Verification ---');
console.log('Active Proposal Dialog Present:', Boolean(activeDialog));
console.log('Active Toast Present:', Boolean(activeToast));
console.log('Unread Count:', unreadCount);

if (!activeDialog) {
  throw new Error('FAILED: activeProposalDialog should be set for non-author engineer!');
}
if (!activeToast) {
  throw new Error('FAILED: activeToast should be set for non-author engineer!');
}
if (unreadCount !== 1) {
  throw new Error('FAILED: unreadCount should be 1!');
}

// 4. Test Dismiss Proposal Dialog (Review Later)
console.log('\n--- Testing Review Later / Dismiss ---');
useNotificationStore.getState().dismissProposalDialog(ownerProposalNotif.id);
console.log('Active Dialog after dismiss:', useNotificationStore.getState().activeProposalDialog);
console.log('Unread Count after dismiss (should remain 1):', useNotificationStore.getState().unreadCount);
const notifInStore = useNotificationStore.getState().notifications.find(n => n.id === ownerProposalNotif.id);

if (useNotificationStore.getState().activeProposalDialog !== null) {
  throw new Error('FAILED: activeProposalDialog should be null after dismiss!');
}
if (useNotificationStore.getState().unreadCount !== 1) {
  throw new Error('FAILED: unreadCount should remain 1 when reviewing later!');
}
if (!notifInStore?.acknowledgedDialog) {
  throw new Error('FAILED: acknowledgedDialog should be true!');
}

// 5. Test Author exclusion: When Owner Sarah Chen proposes, she should not see her own dialog box
console.log('\n--- Testing Author Exclusion ---');
useAuthStore.getState().setUser({
  _id: 'u-1',
  name: 'Sarah Chen',
  email: 'admin@decisionvault.io',
  role: 'owner' as any,
  membershipStatus: 'active',
  organizations: ['org-1'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

console.log('Switched user to Owner:', useAuthStore.getState().user?.name, useAuthStore.getState().user?.email);

useNotificationStore.getState().simulateOwnerProposal();
const ownerActiveDialog = useNotificationStore.getState().activeProposalDialog;
console.log('Owner proposing decision herself - activeProposalDialog is:', ownerActiveDialog);

if (ownerActiveDialog !== null) {
  throw new Error('FAILED: Creator should not get their own popup dialog!');
}

console.log('\n✅ ALL VERIFICATION TESTS PASSED PERFECTLY!');
