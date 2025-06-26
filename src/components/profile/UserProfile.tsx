import React, { useState, useRef } from 'react';
import { useUserStore } from '../../stores/userStore';
import { usePermissions } from '../../hooks/usePermissions';
import { UserCircle, Building2, Mail, LogOut, Settings, FileText, Upload, AlertTriangle } from 'lucide-react';
import { ConvertToProductionModal } from '../auth/ConvertToProductionModal';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function UserProfile() {
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    productionName: '',
    productionAddress: '',
    productionLogo: '',
    productionTerms: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, updateUser, setCurrentUser } = useUserStore();
  const permissions = usePermissions();

  if (!currentUser) return null;

  const handleStartEdit = () => {
    setFormData({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phoneNumber: currentUser.phoneNumber || '',
      email: currentUser.email,
      productionName: currentUser.productionName || '',
      productionAddress: currentUser.productionAddress || '',
      productionLogo: currentUser.productionLogo || '',
      productionTerms: currentUser.productionTerms || ''
    });
    setIsEditing(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, productionLogo: imageUrl }));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await updateUser({
        ...currentUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        productionName: formData.productionName,
        productionAddress: formData.productionAddress,
        productionLogo: formData.productionLogo,
        productionTerms: formData.productionTerms
      });

      setIsEditing(false);
      setIsEditingTerms(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error updating user:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <UserCircle size={28} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]"
                    placeholder="Prénom"
                  />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]"
                    placeholder="Nom"
                  />
                </div>
              ) : (
                `${currentUser.firstName} ${currentUser.lastName}`
              )}
            </h1>
            <p className="text-sm text-gray-500">
              {currentUser.role === 'production' ? 'Compte Production' : 'Compte Utilisateur'}
            </p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Settings size={16} />
            Modifier
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Settings size={16} />
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
            >
              <Settings size={16} />
              Enregistrer les modifications
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Informations du compte */}
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-medium text-gray-900 mb-4">Informations du compte</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Email</div>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 px-2 py-1 border rounded text-sm w-full"
                    placeholder="Email"
                    disabled={true} // Email cannot be changed
                  />
                ) : (
                  <div className="text-sm text-gray-500">{currentUser.email}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserCircle size={18} className="text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Téléphone</div>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="mt-1 px-2 py-1 border rounded text-sm w-full"
                    placeholder="Numéro de téléphone"
                  />
                ) : (
                  <div className="text-sm text-gray-500">{currentUser.phoneNumber || '-'}</div>
                )}
              </div>
            </div>

            {currentUser.role === 'production' && (
              <>
                <div className="flex items-center gap-3">
                  <Building2 size={18} className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Production</div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.productionName}
                        onChange={(e) => setFormData(prev => ({ ...prev, productionName: e.target.value }))}
                        className="mt-1 px-2 py-1 border rounded text-sm w-full"
                        placeholder="Nom de la production"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{currentUser.productionName}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 size={18} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Adresse</div>
                    {isEditing ? (
                      <textarea
                        value={formData.productionAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, productionAddress: e.target.value }))}
                        rows={3}
                        className="mt-1 px-2 py-1 border rounded text-sm w-full"
                        placeholder="Adresse de la production"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 whitespace-pre-line">{currentUser.productionAddress}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 size={18} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Logo</div>
                    {isEditing ? (
                      <div className="flex items-start gap-4 mt-2">
                        {formData.productionLogo && (
                          <div className="relative group">
                            <img
                              src={formData.productionLogo}
                              alt="Logo"
                              className="w-20 h-20 object-contain border rounded-lg"
                            />
                            <button
                              onClick={() => setFormData(prev => ({ ...prev, productionLogo: '' }))}
                              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Settings size={14} className="text-red-500" />
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
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            <Upload size={14} />
                            {formData.productionLogo ? 'Changer le logo' : 'Ajouter un logo'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      currentUser.productionLogo && (
                        <img
                          src={currentUser.productionLogo}
                          alt="Logo"
                          className="w-20 h-20 object-contain border rounded-lg mt-2"
                        />
                      )
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Conditions générales</div>
                      {!isEditing && !isEditingTerms && (
                        <button
                          onClick={() => setIsEditingTerms(true)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                    {isEditing || isEditingTerms ? (
                      <div className="mt-2">
                        <textarea
                          value={formData.productionTerms}
                          onChange={(e) => setFormData(prev => ({ ...prev, productionTerms: e.target.value }))}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Conditions générales de vente..."
                        />
                        {isEditingTerms && !isEditing && (
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => setIsEditingTerms(false)}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={handleSubmit}
                              className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                            >
                              Enregistrer
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-gray-500 bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
                        {currentUser.productionTerms ? (
                          <div className="whitespace-pre-line">{currentUser.productionTerms}</div>
                        ) : (
                          <span className="text-gray-400 italic">Aucune condition générale définie</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <Settings size={18} className="text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Membre depuis</div>
                <div className="text-sm text-gray-500">
                  {new Date(currentUser.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings size={18} className="text-gray-400" />
            <h2 className="text-base font-medium text-gray-900">Accès</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t space-y-4">
          {currentUser.role === 'user' && (
            <button
              onClick={() => setIsConvertModalOpen(true)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Settings size={16} />
              Convertir en compte production
            </button>
          )}

          <button
            onClick={() => setCurrentUser(null)}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
          >
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </div>

      <ConvertToProductionModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
      />
    </div>
  );
}