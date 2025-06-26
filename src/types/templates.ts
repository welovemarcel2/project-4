import { BudgetCategory } from './budget';

export interface BudgetTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  budget: BudgetCategory[];
  ownerId: string; // ID de l'utilisateur qui a créé le modèle
}

export interface TemplatesState {
  templates: BudgetTemplate[];
}