import { Project, Quote } from '../types/project';
import { DEFAULT_SETTINGS } from '../types/quoteSettings';
import { initialBudget } from './budget';

export const initialProjects: Project[] = [
  {
    id: 'demo-project',
    name: 'Film Promotionnel - Exemple',
    client: 'Acme Corporation',
    settings: DEFAULT_SETTINGS,
    ownerId: 'demo-user',
    sharedWith: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  }
];

export const initialQuotes: Quote[] = [
  {
    id: 'demo-quote',
    projectId: 'demo-project',
    name: 'Version initiale',
    type: 'main',
    status: 'draft',
    version: 1,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  }
];