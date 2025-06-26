import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProjectHistoryState, ProjectHistory, ProjectVersion } from '../types/history';
import { BudgetCategory } from '../types/budget';
import { User } from '../types/user';
import { generateId } from '../utils/generateId';
import { calculateTotalCosts } from '../utils/budgetCalculations/totals';
import { DEFAULT_SETTINGS } from '../types/quoteSettings';

export const useHistoryStore = create<ProjectHistoryState>()(
  persist(
    (set, get) => ({
      histories: {},

      createVersion: (projectId: string, quoteId: string, budget: BudgetCategory[], user: User, description: string) => {
        // Calculate total budget for this version
        const { grandTotal } = calculateTotalCosts(budget, DEFAULT_SETTINGS);

        // Create new version
        const newVersion: ProjectVersion = {
          id: generateId(),
          timestamp: new Date(),
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          },
          budget: structuredClone(budget),
          description,
          totalAmount: grandTotal,
          quoteId // Store the quoteId with each version
        };

        // Update history with new version
        set(state => {
          // Get or create history for this project
          const currentHistory = state.histories[projectId] || {
            projectId,
            versions: [],
            lastSavedAt: undefined,
            isDirty: false
          };

          // Get versions for this quote only
          const quoteVersions = currentHistory.versions.filter(v => v.quoteId === quoteId);

          // Check if this is a duplicate of the last version for this quote
          if (quoteVersions.length > 0) {
            const lastVersion = quoteVersions[0]; // Versions are stored newest first
            
            // Compare budgets and check timestamp
            const lastBudgetString = JSON.stringify(lastVersion.budget);
            const newBudgetString = JSON.stringify(budget);
            const timeSinceLastVersion = Date.now() - new Date(lastVersion.timestamp).getTime();
            
            // Skip if identical budget and less than 30 seconds have passed
            if (lastBudgetString === newBudgetString && timeSinceLastVersion < 30000) {
              return {
                histories: {
                  ...state.histories,
                  [projectId]: {
                    ...currentHistory,
                    lastSavedAt: new Date(),
                    isDirty: false
                  }
                }
              };
            }
          }

          // Get all versions
          const allVersions = Array.isArray(currentHistory.versions) ? currentHistory.versions : [];
          
          // Add new version at the start (newest first)
          const updatedVersions = [newVersion, ...allVersions];

          return {
            histories: {
              ...state.histories,
              [projectId]: {
                ...currentHistory,
                versions: updatedVersions,
                lastSavedAt: new Date(),
                isDirty: false
              }
            }
          };
        });
      },

      getHistory: (projectId: string, quoteId: string): ProjectHistory | undefined => {
        const history = get().histories[projectId];
        if (!history) {
          return {
            projectId,
            versions: [],
            lastSavedAt: undefined,
            isDirty: false
          };
        }

        // Filter versions to only include those for this quote
        return {
          ...history,
          versions: history.versions.filter(v => v.quoteId === quoteId)
        };
      },

      restoreVersion: (projectId: string, versionId: string): BudgetCategory[] | undefined => {
        const history = get().histories[projectId];
        if (!history?.versions) return undefined;

        const version = history.versions.find(v => v.id === versionId);
        if (!version) return undefined;

        return structuredClone(version.budget);
      },

      setDirty: (projectId: string, isDirty: boolean) => {
        set(state => {
          const currentHistory = state.histories[projectId] || {
            projectId,
            versions: [],
            lastSavedAt: undefined,
            isDirty: false
          };

          return {
            histories: {
              ...state.histories,
              [projectId]: {
                ...currentHistory,
                isDirty
              }
            }
          };
        });
      },

      updateLastSaved: (projectId: string) => {
        set(state => {
          const currentHistory = state.histories[projectId] || {
            projectId,
            versions: [],
            lastSavedAt: undefined,
            isDirty: false
          };

          return {
            histories: {
              ...state.histories,
              [projectId]: {
                ...currentHistory,
                lastSavedAt: new Date(),
                isDirty: false
              }
            }
          };
        });
      }
    }),
    {
      name: 'project-history',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        histories: Object.fromEntries(
          Object.entries(state.histories).map(([key, history]) => [
            key,
            {
              ...history,
              versions: history.versions.map(version => ({
                ...version,
                timestamp: version.timestamp.toISOString() // Convert Date to string for storage
              })),
              lastSavedAt: history.lastSavedAt?.toISOString() // Convert Date to string for storage
            }
          ])
        )
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.histories) {
          // Convert stored ISO strings back to Date objects
          Object.values(state.histories).forEach(history => {
            history.versions = history.versions.map(version => ({
              ...version,
              timestamp: new Date(version.timestamp) // Convert string back to Date
            }));
            if (history.lastSavedAt) {
              history.lastSavedAt = new Date(history.lastSavedAt);
            }
          });
        }
      }
    }
  )
);