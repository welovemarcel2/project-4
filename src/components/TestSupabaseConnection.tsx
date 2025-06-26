import React, { useState } from 'react';
import { testSupabaseConnection, testBudgetCRUD } from '../utils/testSupabaseConnection';
import { Loader2, CheckCircle, XCircle, Database, RefreshCw } from 'lucide-react';

export function TestSupabaseConnection() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [quoteId, setQuoteId] = useState('');
  const [isCrudTesting, setIsCrudTesting] = useState(false);
  const [crudResult, setCrudResult] = useState<any>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const connectionResult = await testSupabaseConnection();
      setResult(connectionResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrudTest = async () => {
    if (!quoteId) {
      setCrudResult({
        success: false,
        error: 'Veuillez entrer un ID de devis'
      });
      return;
    }

    setIsCrudTesting(true);
    setCrudResult(null);
    try {
      const testResult = await testBudgetCRUD(quoteId);
      setCrudResult(testResult);
    } catch (error) {
      setCrudResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsCrudTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Database className="text-blue-600" />
        Test de Connexion Supabase
      </h2>

      <div className="mb-8">
        <button
          onClick={handleTest}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Test en cours...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              Tester la connexion
            </>
          )}
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-600" size={20} />
              )}
              <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Connexion réussie' : 'Échec de la connexion'}
              </h3>
            </div>
            
            {result.success ? (
              <div className="mt-2 space-y-2">
                <div className="text-sm text-green-700">
                  <p>✓ Connexion à Supabase établie</p>
                  <p>✓ Accès aux tables de budgets vérifié</p>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-1">Données récupérées:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-700">
                <p>Erreur: {result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Test CRUD sur les budgets</h3>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={quoteId}
            onChange={(e) => setQuoteId(e.target.value)}
            placeholder="ID du devis à tester"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCrudTest}
            disabled={isCrudTesting || !quoteId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isCrudTesting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Test en cours...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Tester CRUD
              </>
            )}
          </button>
        </div>

        {crudResult && (
          <div className={`mt-4 p-4 rounded-md ${crudResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {crudResult.success ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-600" size={20} />
              )}
              <h3 className={`font-semibold ${crudResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {crudResult.success ? 'Test CRUD réussi' : 'Échec du test CRUD'}
              </h3>
            </div>
            
            <div className="text-sm">
              {crudResult.success ? (
                <p className="text-green-700">{crudResult.message}</p>
              ) : (
                <p className="text-red-700">Erreur: {crudResult.error}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}