import { useEffect, useCallback, useRef } from 'react';
import { useHistoryStore } from '../stores/historyStore';
import { useUserStore } from '../stores/userStore';
import { BudgetCategory } from '../types/budget';

const AUTOSAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DIRTY_CHECK_INTERVAL = 1000; // 1 second

// Hook pour gérer la sauvegarde automatique du budget
export function useAutoSave(
  projectId: string,
  budget: BudgetCategory[],
  onSave: () => Promise<void>
) {
  const lastBudgetRef = useRef<string>();
  const lastSaveTimeRef = useRef<number>(Date.now());
  const isSavingRef = useRef<boolean>(false);
  const isDirtyRef = useRef<boolean>(false);
  const { createVersion, setDirty } = useHistoryStore();
  const currentUser = useUserStore(state => state.currentUser);

  // Function to check if budget has changed
  const checkIfDirty = useCallback(() => {
    const currentBudgetString = JSON.stringify(budget);
    // Marquer comme modifié si le budget a changé depuis la dernière sauvegarde
    if (lastBudgetRef.current !== currentBudgetString) {
      setDirty(projectId, true);
      isDirtyRef.current = true;
    }
  }, [budget, projectId, setDirty]);

  // Save function
  const saveChanges = useCallback(async () => {
    if (!currentUser || isSavingRef.current) return false;

    const currentBudgetString = JSON.stringify(budget);
    if (lastBudgetRef.current !== currentBudgetString) {
      try {
        isSavingRef.current = true;
        await createVersion(projectId, budget, currentUser, 'Sauvegarde automatique');
        lastBudgetRef.current = currentBudgetString;
        lastSaveTimeRef.current = Date.now();
        isDirtyRef.current = false;
        await onSave();
        return true;
      } catch (error) {
        console.error('Error saving budget:', error);
        return false;
      } finally {
        isSavingRef.current = false;
      }
    }
    return false;
  }, [budget, projectId, currentUser, createVersion, onSave]);

  // Manual save function
  const manualSave = useCallback(async () => {
    if (!currentUser || isSavingRef.current) return false;

    try {
      isSavingRef.current = true;
      await createVersion(projectId, budget, currentUser, 'Sauvegarde manuelle');
      lastBudgetRef.current = JSON.stringify(budget);
      lastSaveTimeRef.current = Date.now();
      isDirtyRef.current = false;
      await onSave();
      return true;
    } catch (error) {
      console.error('Error during manual save:', error);
      return false;
    } finally {
      isSavingRef.current = false;
    }
    return false;
  }, [budget, projectId, currentUser, createVersion, onSave]);

  // Auto-save effect
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
      if (timeSinceLastSave >= AUTOSAVE_INTERVAL) {
        await saveChanges();
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(autoSaveInterval);
  }, [saveChanges]);

  // Dirty check effect
  useEffect(() => {
    const dirtyCheckInterval = setInterval(checkIfDirty, DIRTY_CHECK_INTERVAL);
    return () => clearInterval(dirtyCheckInterval);
  }, [checkIfDirty]);

  // Prevent closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const history = useHistoryStore.getState().getHistory(projectId);
      if (history?.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId]);

  return { saveChanges: manualSave, isDirty: useHistoryStore.getState().getHistory(projectId)?.isDirty };
}