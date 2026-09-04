import type { DecisionStatus } from '@/lib/constants';

export interface Alternative {
  _id?: string;
  title: string;
  description: string;
  pros?: string;
  cons?: string;
}

export interface Decision {
  _id: string;
  title: string;
  problemStatement: string;
  context: string;
  alternatives: Alternative[];
  finalDecision: string;
  reasoning: string;
  consequences: string;
  status: DecisionStatus;
  tags: string[];
  owners: string[];
  contributors: string[];
  organizationId: string;
  teamId?: string;
  attachments: string[];
  yjsDocId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields (from API joins)
  ownerDetails?: Array<{ _id: string; name: string; avatar?: string }>;
  teamDetails?: { _id: string; name: string };
}
