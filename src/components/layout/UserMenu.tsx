import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { UserCircle, Building2, Mail, LogOut, Settings } from 'lucide-react';
import { UserProfile } from '../profile/UserProfile';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { currentUser, setCurrentUser } = useUserStore();

  if (!currentUser) return null;

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="relative">
      {/* Bouton du menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
      >
        <UserCircle size={20} className="text-gray-400" />
        <span className="font-medium">{currentUser.firstName} {currentUser.lastName}</span>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* En-tête avec les informations de l'utilisateur */}
          <div className="px-4 py-2 border-b">
            <div className="font-medium text-gray-900">
              {currentUser.firstName} {currentUser.lastName}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1.5">
              <Mail size={14} />
              {currentUser.email}
            </div>
            {currentUser.role === 'production' && currentUser.productionName && (
              <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <Building2 size={14} />
                {currentUser.productionName}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowProfile(true);
              }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <Settings size={16} className="text-gray-500" />
              Paramètres du compte
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modal du profil */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Paramètres du compte</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Settings size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <UserProfile />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}