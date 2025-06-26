import React from 'react';
import { useAllCurrencies } from '../../hooks/useAllCurrencies';

export default function CurrencySettingsTab() {
  const { currencies, loading, error, defaultCurrency, setDefaultCurrency } = useAllCurrencies();

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement des devises…</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Monnaie du projet</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Par défaut</th>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-right">Taux (vs EUR)</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map(currency => (
              <tr key={currency.code} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                <td className="px-4 py-2 text-center">
                  <input
                    type="radio"
                    name="default-currency"
                    checked={currency.code === defaultCurrency}
                    onChange={() => setDefaultCurrency(currency.code)}
                    className="accent-blue-600"
                  />
                </td>
                <td className="px-4 py-2 font-mono font-semibold">{currency.code}</td>
                <td className="px-4 py-2">{currency.name}</td>
                <td className="px-4 py-2 text-right">{currency.rate.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Les taux sont mis à jour en temps réel via exchangerate.host. La monnaie par défaut sera utilisée pour tous les calculs du budget.
      </div>
    </div>
  );
} 