import { BudgetCategory } from '../../types/budget';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface PersistenceStats {
  lastSync: Date | null;
  syncCount: number;
  errorCount: number;
}

/**
 * Sauvegarde un budget dans Supabase
 * 
 * @param quoteId L'ID du devis associé au budget
 * @param budget Les données du budget à sauvegarder
 * @param isWorkBudget Indique s'il s'agit d'un budget de travail
 * @returns Un objet avec le résultat de l'opération
 */
export async function saveBudgetToSupabase(
  quoteId: string,
  budget: BudgetCategory[],
  isWorkBudget: boolean = false
): Promise<{ success: boolean; error?: string }> {
  console.log(`[budgetPersistence] Sauvegarde ${isWorkBudget ? 'du budget de travail' : 'du budget'} pour le devis ${quoteId}`);
  
  try {
    if (!navigator.onLine) {
      console.log('[budgetPersistence] Hors ligne, la sauvegarde sera effectuée ultérieurement');
      return { 
        success: false, 
        error: 'Hors ligne - les modifications seront synchronisées ultérieurement' 
      };
    }

    // Extraire les commentaires pour les budgets de travail
    const comments: Record<string, string> = {};
    if (isWorkBudget) {
      const extractComments = (items: any[]) => {
        items.forEach(item => {
          if (item.comments) {
            comments[item.id] = item.comments;
          }
          if (item.subItems && item.subItems.length > 0) {
            extractComments(item.subItems);
          }
        });
      };
      
      budget.forEach(category => {
        extractComments(category.items);
      });
    }

    // Utiliser upsert pour créer ou mettre à jour le budget
    const { error } = isWorkBudget
      ? await supabase
          .from('quote_work_budgets')
          .upsert(
            { 
              quote_id: quoteId, 
              budget_data: budget,
              comments: comments,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'quote_id' }
          )
      : await supabase
          .from('quote_budgets')
          .upsert(
            { 
              quote_id: quoteId, 
              budget_data: budget,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'quote_id' }
          );

    if (error) {
      console.error('[budgetPersistence] Erreur de sauvegarde:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    console.log(`[budgetPersistence] Budget ${isWorkBudget ? 'de travail ' : ''}sauvegardé avec succès`);
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[budgetPersistence] Exception lors de la sauvegarde:', error);
    return { 
      success: false, 
      error 
    };
  }
}

/**
 * Charge un budget depuis Supabase
 * 
 * @param quoteId L'ID du devis dont on veut charger le budget
 * @param isWorkBudget Indique s'il s'agit d'un budget de travail
 * @returns Le budget chargé ou un tableau vide en cas d'erreur
 */
export async function loadBudgetFromSupabase(
  quoteId: string,
  isWorkBudget: boolean = false
): Promise<{ budget: BudgetCategory[]; comments?: Record<string, string>; success: boolean; error?: string }> {
  console.log(`[budgetPersistence] Chargement ${isWorkBudget ? 'du budget de travail' : 'du budget'} pour le devis ${quoteId}`);
  
  try {
    if (!navigator.onLine) {
      console.log('[budgetPersistence] Hors ligne, impossible de charger depuis Supabase');
      return { 
        budget: [], 
        success: false, 
        error: 'Hors ligne - impossible de charger les données' 
      };
    }

    // Charger le budget depuis la table appropriée
    const { data, error } = isWorkBudget
      ? await supabase
          .from('quote_work_budgets')
          .select('budget_data, comments')
          .eq('quote_id', quoteId)
          .maybeSingle()
      : await supabase
          .from('quote_budgets')
          .select('budget_data')
          .eq('quote_id', quoteId)
          .maybeSingle();

    if (error) {
      console.error('[budgetPersistence] Erreur de chargement:', error);
      return { 
        budget: [], 
        success: false, 
        error: error.message 
      };
    }

    if (!data) {
      console.log(`[budgetPersistence] Aucun budget ${isWorkBudget ? 'de travail ' : ''}trouvé pour le devis ${quoteId}`);
      return { 
        budget: [], 
        success: true 
      };
    }

    const budget = data.budget_data || [];
    console.log(`[budgetPersistence] Budget ${isWorkBudget ? 'de travail ' : ''}chargé avec succès, ${budget.length} catégories`);
    
    // Pour les budgets de travail, renvoyer aussi les commentaires
    if (isWorkBudget && data.comments) {
      return { 
        budget, 
        comments: data.comments, 
        success: true 
      };
    }

    return { budget, success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[budgetPersistence] Exception lors du chargement:', error);
    return { 
      budget: [], 
      success: false, 
      error 
    };
  }
}

/**
 * Supprime un budget de Supabase
 * 
 * @param quoteId L'ID du devis dont on veut supprimer le budget
 * @param isWorkBudget Indique s'il s'agit d'un budget de travail
 * @returns Un objet avec le résultat de l'opération
 */
export async function deleteBudgetFromSupabase(
  quoteId: string,
  isWorkBudget: boolean = false
): Promise<{ success: boolean; error?: string }> {
  console.log(`[budgetPersistence] Suppression ${isWorkBudget ? 'du budget de travail' : 'du budget'} pour le devis ${quoteId}`);
  
  try {
    if (!navigator.onLine) {
      console.log('[budgetPersistence] Hors ligne, impossible de supprimer depuis Supabase');
      return { 
        success: false, 
        error: 'Hors ligne - la suppression sera effectuée ultérieurement' 
      };
    }

    // Supprimer le budget de la table appropriée
    const { error } = isWorkBudget
      ? await supabase
          .from('quote_work_budgets')
          .delete()
          .eq('quote_id', quoteId)
      : await supabase
          .from('quote_budgets')
          .delete()
          .eq('quote_id', quoteId);

    if (error) {
      console.error('[budgetPersistence] Erreur de suppression:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    console.log(`[budgetPersistence] Budget ${isWorkBudget ? 'de travail ' : ''}supprimé avec succès`);
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[budgetPersistence] Exception lors de la suppression:', error);
    return { 
      success: false, 
      error 
    };
  }
}

/**
 * Vérifier si un budget existe dans Supabase
 * 
 * @param quoteId L'ID du devis à vérifier
 * @param isWorkBudget Indique s'il s'agit d'un budget de travail
 * @returns True si le budget existe, false sinon
 */
export async function checkBudgetExistsInSupabase(
  quoteId: string,
  isWorkBudget: boolean = false
): Promise<boolean> {
  try {
    if (!navigator.onLine) {
      return false;
    }

    // Vérifier l'existence du budget dans la table appropriée
    const { data, error } = isWorkBudget
      ? await supabase
          .from('quote_work_budgets')
          .select('id')
          .eq('quote_id', quoteId)
          .maybeSingle()
      : await supabase
          .from('quote_budgets')
          .select('id')
          .eq('quote_id', quoteId)
          .maybeSingle();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (err) {
    console.error('[budgetPersistence] Erreur lors de la vérification de l\'existence du budget:', err);
    return false;
  }
}