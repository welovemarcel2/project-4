import React, { useState } from 'react';
import { X, Mail, AlertTriangle } from 'lucide-react';
import { Project, ProjectShare } from '../../types/project';

interface ShareProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string, permissions: { canEdit: boolean; canShare: boolean }) => void;
}

export function ShareProjectModal({ project, isOpen, onClose, onShare }: ShareProjectModalProps) {
  const [email, setEmail] = useState('');
  const [canEdit, setCanEdit] = useState(true);
  const [canShare, setCanShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation de l'email
    if (!email.includes('@')) {
      setError("L'adresse email n'est pas valide");
      return;
    }

    // Vérifier si le projet est déjà partagé avec cet email
    if (project.sharedWith?.some(share => share.email === email)) {
      setError("Le projet est déjà partagé avec cet utilisateur");
      return;
    }

    onShare(email, { canEdit, canShare });
    setEmail('');
    setCanEdit(true);
    setCanShare(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Partager le projet</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="collaborateur@exemple.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={canEdit}
                onChange={(e) => setCanEdit(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Peut modifier le projet
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={canShare}
                onChange={(e) => setCanShare(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Peut partager le projet
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

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
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Partager
            </button>
          </div>
        </form>

        {project.sharedWith && project.sharedWith.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Utilisateurs ayant accès au projet
            </h3>
            <div className="space-y-2">
              {project.sharedWith.map((share) => (
                <div 
                  key={share.email}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {share.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      Partagé par {share.sharedBy.firstName} {share.sharedBy.lastName}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {share.permissions.canEdit && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        Modification
                      </span>
                    )}
                    {share.permissions.canShare && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Partage
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}