import React, { useRef } from 'react';
import { ProductionInformation } from '../../../types/quoteSettings';
import { Upload } from 'lucide-react';
import { useUserStore } from '../../../stores/userStore';

interface ProductionSettingsProps {
  production: ProductionInformation;
  onChange: (production: ProductionInformation) => void;
}

export function ProductionSettings({ production, onChange }: ProductionSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useUserStore(state => state.currentUser);

  const handleChange = (field: keyof ProductionInformation, value: string) => {
    onChange({
      ...production,
      [field]: value
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Créer une URL pour le fichier sélectionné
      const imageUrl = URL.createObjectURL(file);
      handleChange('logo', imageUrl);
    }
  };

  // Si l'utilisateur est une production, utiliser ses informations
  React.useEffect(() => {
    if (currentUser?.role === 'production') {
      onChange({
        ...production,
        name: currentUser.productionName || '',
        address: currentUser.productionAddress || '',
        logo: currentUser.productionLogo || ''
      });
    }
  }, [currentUser]);

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-900">Informations de production</h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Production
          </label>
          <input
            type="text"
            value={production.name}
            disabled={true} // Le nom est toujours désactivé
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
          />
          {currentUser?.role === 'production' && (
            <p className="mt-1 text-xs text-gray-500">
              Le nom de la production ne peut pas être modifié
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Adresse
          </label>
          <textarea
            value={production.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Adresse complète"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Logo
          </label>
          <div className="flex items-start gap-4">
            {production.logo && (
              <div className="relative group">
                <img
                  src={production.logo}
                  alt="Logo"
                  className="w-24 h-24 object-contain border rounded-lg"
                />
                <button
                  onClick={() => handleChange('logo', '')}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Upload size={16} />
                {production.logo ? 'Changer le logo' : 'Ajouter un logo'}
              </button>
              <p className="mt-1 text-xs text-gray-500">
                Format recommandé : PNG ou JPEG
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Producteur
          </label>
          <input
            type="text"
            value={production.producer}
            onChange={(e) => handleChange('producer', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom du producteur"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Directeur de production
          </label>
          <input
            type="text"
            value={production.productionManager}
            onChange={(e) => handleChange('productionManager', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom du directeur de production"
          />
        </div>
      </div>
    </div>
  );
}