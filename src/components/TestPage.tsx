import React from 'react';
import { TestSupabaseConnection } from './TestSupabaseConnection';

export function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Page de test de connexion Supabase
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Vérifiez la connexion entre vos items de budget et Supabase
          </p>
        </div>
        
        <TestSupabaseConnection />
      </div>
    </div>
  );
}