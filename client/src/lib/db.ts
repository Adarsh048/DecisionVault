import Dexie, { type EntityTable } from 'dexie';
import type { DecisionRecord } from '@/store/decisionStore';

export interface OutboxItem {
  id: string;
  type: 'create_decision' | 'update_status' | 'vote_decision' | 'save_draft';
  payload: any;
  createdAt: string;
  attempts: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface LocalDraft {
  id: string; // e.g. 'new-decision-draft' or a decision id
  title: string;
  team: string;
  status: string;
  tags: string[];
  context: string;
  decision: string;
  consequences: string;
  alternatives?: string;
  updatedAt: string;
}

export interface SyncMetadata {
  key: string;
  value: any;
}

/**
 * DecisionVault Local-First IndexedDB Database powered by Dexie.js
 * Provides persistent offline storage for ADRs, outbox mutations, and active drafts.
 */
export class DecisionVaultDatabase extends Dexie {
  decisions!: EntityTable<DecisionRecord & { synced?: boolean }, 'id'>;
  outbox!: EntityTable<OutboxItem, 'id'>;
  drafts!: EntityTable<LocalDraft, 'id'>;
  metadata!: EntityTable<SyncMetadata, 'key'>;

  constructor() {
    super('DecisionVaultDB');
    this.version(1).stores({
      decisions: 'id, number, status, team, createdAt, updatedAt',
      outbox: 'id, type, status, createdAt',
      drafts: 'id, updatedAt',
      metadata: 'key',
    });
  }
}

export const db = new DecisionVaultDatabase();
