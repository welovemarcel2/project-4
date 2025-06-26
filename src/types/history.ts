import { BudgetCategory } from './budget';
import { User } from './user';

export interface ProjectVersion {
  id: string;
  timestamp: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  budget: BudgetCategory[];
  description: string;
  totalAmount: number;
  quoteId: string; // Added quoteId field
}

export interface ProjectHistory {
  projectId: string;
  versions: ProjectVersion[];
  lastSavedAt?: Date;
  isDirty?: boolean;
}

export type ProjectHistoryState = {
  histories: Record<string, ProjectHistory>;
  createVersion: (projectId: string, quoteId: string, budget: BudgetCategory[], user: User, description: string) => void;
  getHistory: (projectId: string, quoteId: string) => ProjectHistory | undefined;
  restoreVersion: (projectId: string, versionId: string) => BudgetCategory[] | undefined;
  setDirty: (projectId: string, isDirty: boolean) => void;
  updateLastSaved: (projectId: string) => void;
};