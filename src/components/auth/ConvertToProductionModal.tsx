import React, { useState, useRef } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ConvertToProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConvertToProductionModal({ isOpen, onClose }: ConvertToProductionModalProps) {
  const [productionName, setProductionName] = useState('');
  const [productionAddress, setProductionAddress] = useState('');
  const [productionLogo, setProductionLogo] = useState<string>('');
  const [productionTerms, setProductionTerms] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, updateUser } = useUserStore();

  if (!isOpen || !currentUser) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProductionLogo(imageUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!productionName.trim()) {
        throw new Error('Le nom de la production est requis');
      }

      console.log('Creating production record...');
      // 1. Create production record
      const { data: production, error: productionError } = await supabase
        .from('productions')
        .insert({
          user_id: currentUser.id,
          name: productionName.trim(),
          address: productionAddress.trim(),
          logo_url: productionLogo
        })
        .select()
        .single();

      if (productionError) throw productionError;
      console.log('Production record created:', production);

      // 2. Create production terms if provided
      if (productionTerms.trim()) {
        console.log('Creating production terms...');
        const { error: termsError } = await supabase
          .from('production_terms')
          .insert({
            production_id: production.id, // Use the production.id, not user_id
            terms_and_conditions: productionTerms.trim()
          });

        if (termsError) {
          console.error('Error creating production terms:', termsError);
          // Continue even if terms creation fails
        } else {
          console.log('Production terms created successfully');
        }
      }

      console.log('Updating user role to production...');
      // 3. Update user role
      const { error: userError } = await supabase
        .from('users')
        .update({
          role: 'production'
        })
        .eq('id', currentUser.id);

      if (userError) throw userError;
      console.log('User role updated successfully');

      // 4. Update local user state
      await updateUser({
        ...currentUser,
        role: 'production',
        productionName: productionName.trim(),
        productionAddress: productionAddress.trim(),
        productionLogo: productionLogo,
        productionTerms: productionTerms.trim()
      });

      onClose();
    } catch (err) {
      console.error('Error converting to production:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Devenir une production</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la production *
            </label>
            <input
              type="text"
              value={productionName}
              onChange={(e) => setProductionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: ACME Productions"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse postale
            </label>
            <textarea
              value={productionAddress}
              onChange={(e) => setProductionAddress(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adresse complète de la production"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <div className="flex items-start gap-4">
              {productionLogo && (
                <div className="relative group">
                  <img
                    src={productionLogo}
                    alt="Logo"
                    className="w-24 h-24 object-contain border rounded-lg"
                  />
                  <button
                    onClick={() => setProductionLogo('')}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
              )}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Upload size={16} />
                  {productionLogo ? 'Changer le logo' : 'Ajouter un logo'}
                </button>
                <p className="mt-1 text-xs text-gray-500">
                  Format recommandé : PNG ou JPEG
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conditions générales
            </label>
            <textarea
              value={productionTerms}
              onChange={(e) => setProductionTerms(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Conditions générales de vente..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="pt-4 border-t mt-6">
            <p className="text-sm text-gray-500 mb-4">
              En convertissant votre compte en compte production, vous pourrez :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Gérer plusieurs projets simultanément</li>
                <li>Partager vos projets avec vos collaborateurs</li>
                <li>Accéder à des fonctionnalités avancées de gestion</li>
              </ul>
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !productionName.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Conversion...' : 'Convertir en production'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}