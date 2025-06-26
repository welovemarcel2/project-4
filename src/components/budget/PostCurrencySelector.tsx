import React, { useState } from 'react';
import { useCurrencyStore } from '../../stores/currencyStore';
import { X } from 'lucide-react';

interface PostCurrencySelectorProps {
  value: string; // code devise courante
  onChange: (currencyCode: string) => void;
  disabled?: boolean;
}

export default function PostCurrencySelector({ value, onChange, disabled }: PostCurrencySelectorProps) {
  const currencies = useCurrencyStore(state => state.currencies);
  const [open, setOpen] = useState(false);
  const selected = currencies.find(c => c.code === value) || currencies[0];

  if (!currencies || currencies.length === 0) return <span className="text-gray-400">…</span>;

  return (
    <>
      {/* Symbole cliquable dans la cellule */}
      <button
        type="button"
        className="text-xs px-1 py-0.5 rounded hover:bg-blue-50 transition cursor-pointer"
        style={{ minWidth: 24 }}
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        title="Changer la devise du poste"
      >
        {selected?.symbol}
      </button>
      {/* Popup modale */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 min-w-[340px] max-w-[95vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Choisir une devise</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th></th>
                  <th>Symbole</th>
                  <th>Code</th>
                  <th>Nom</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map(cur => (
                  <tr
                    key={cur.code}
                    className={`hover:bg-blue-50 transition cursor-pointer ${cur.code === value ? 'bg-blue-50 font-bold' : ''}`}
                    onClick={() => {
                      setOpen(false);
                      onChange(cur.code);
                    }}
                  >
                    <td className="text-center">
                      <input
                        type="radio"
                        name="currency-radio"
                        checked={cur.code === value}
                        readOnly
                        className="accent-blue-600"
                      />
                    </td>
                    <td className="text-center text-base">{cur.symbol}</td>
                    <td className="font-mono font-semibold">{cur.code}</td>
                    <td className="text-gray-700">{cur.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// Petite animation fade-in
// Ajoute dans ton CSS global ou tailwind.config.js :
// .animate-fade-in { animation: fadeIn 0.15s ease; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: none; } } 