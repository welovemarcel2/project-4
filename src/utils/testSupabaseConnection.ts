import { createClient } from '@supabase/supabase-js';

// Initialiser le client Supabase avec les variables d'environnement
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Fonction pour tester la connexion à Supabase
export async function testSupabaseConnection() {
  try {
    console.log('Tentative de connexion à Supabase...');
    
    // Vérifier si les variables d'environnement sont définies
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return {
        success: false,
        error: 'Variables d\'environnement Supabase manquantes'
      };
    }
    
    // Tester la connexion en récupérant les projets
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);
    
    if (error) throw error;
    
    console.log('Connexion à Supabase réussie:', data);
    
    // Tester la connexion aux budgets
    const { data: budgetData, error: budgetError } = await supabase
      .from('quote_budgets')
      .select('id, quote_id')
      .limit(1);
    
    if (budgetError) throw budgetError;
    
    console.log('Connexion aux budgets réussie:', budgetData);
    
    // Tester la connexion aux budgets de travail
    const { data: workBudgetData, error: workBudgetError } = await supabase
      .from('quote_work_budgets')
      .select('id, quote_id')
      .limit(1);
    
    if (workBudgetError) throw workBudgetError;
    
    console.log('Connexion aux budgets de travail réussie:', workBudgetData);
    
    return {
      success: true,
      data: {
        projects: data,
        budgets: budgetData,
        workBudgets: workBudgetData
      }
    };
  } catch (error) {
    console.error('Erreur de connexion à Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

// Fonction pour vérifier les opérations CRUD sur les budgets
export async function testBudgetCRUD(quoteId: string) {
  try {
    console.log(`Test des opérations CRUD sur les budgets pour le devis ${quoteId}...`);
    
    // 1. Récupérer le budget actuel
    const { data: existingBudget, error: getBudgetError } = await supabase
      .from('quote_budgets')
      .select('budget_data')
      .eq('quote_id', quoteId)
      .single();
    
    if (getBudgetError && getBudgetError.code !== 'PGRST116') { // PGRST116 = No rows returned
      throw getBudgetError;
    }
    
    // 2. Créer ou mettre à jour le budget
    const testBudget = existingBudget?.budget_data || [];
    const testCategory = {
      id: crypto.randomUUID(),
      name: 'Test Category',
      isExpanded: true,
      items: [
        {
          id: crypto.randomUUID(),
          type: 'post',
          name: 'Test Post',
          parentId: null,
          quantity: 1,
          number: 1,
          unit: 'Jour',
          rate: 100,
          socialCharges: '',
          agencyPercent: 10,
          marginPercent: 15,
          subItems: []
        }
      ]
    };
    
    const updatedBudget = [...testBudget, testCategory];
    
    // Utiliser upsert pour gérer à la fois l'insertion et la mise à jour
    const { data: upsertResult, error: upsertError } = await supabase
      .from('quote_budgets')
      .upsert(
        { 
          quote_id: quoteId, 
          budget_data: updatedBudget 
        },
        {
          onConflict: 'quote_id'
        }
      );
    
    if (upsertError) throw upsertError;
    
    console.log('Budget mis à jour avec succès');
    
    // 3. Récupérer le budget mis à jour pour vérifier
    const { data: updatedData, error: getUpdatedError } = await supabase
      .from('quote_budgets')
      .select('budget_data')
      .eq('quote_id', quoteId)
      .single();
    
    if (getUpdatedError) throw getUpdatedError;
    
    console.log('Budget récupéré après mise à jour:', updatedData);
    
    // 4. Restaurer le budget original
    const { error: restoreError } = await supabase
      .from('quote_budgets')
      .update({ budget_data: existingBudget?.budget_data || [] })
      .eq('quote_id', quoteId);
    
    if (restoreError) throw restoreError;
    
    console.log('Budget original restauré avec succès');
    
    return {
      success: true,
      message: 'Test CRUD réussi sur les budgets'
    };
  } catch (error) {
    console.error('Erreur lors du test CRUD sur les budgets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}