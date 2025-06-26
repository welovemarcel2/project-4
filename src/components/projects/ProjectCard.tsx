import React, { useState } from 'react';
import { Project, Quote, QuoteStatus } from '../../types/project';
import { useUserStore } from '../../stores/userStore';
import { Building2, Share2, UserCircle, Archive, CheckCircle2, Clock, XCircle, RotateCcw, Trash2 } from 'lucide-react';
import { ShareProjectModal } from './ShareProjectModal';
import { QuoteSettings } from '../../types/quoteSettings';
import { DeleteButton } from '../common/DeleteButton';
import { formatNumber } from '../../utils/formatNumber';
import { calculateTotalCosts } from '../../utils/budgetCalculations/totals';
import { CurrencyDisplay } from '../budget/CurrencyDisplay';
import { useCurrencyStore } from '../../stores/currencyStore';

// Default settings if project settings are undefined
const DEFAULT_SETTINGS: QuoteSettings = {
  socialChargeRates: [],
  availableUnits: ['Jour', 'Forfait', 'Semaine', 'Heure', '%', '-'],
  defaultAgencyPercent: 10,
  defaultMarginPercent: 15,
  showEmptyItems: true,
  socialChargesDisplay: 'detailed',
  applySocialChargesMargins: false,
  production: {
    name: '',
    address: '',
    logo: '',
    producer: '',
    productionManager: ''
  },
  information: {
    agency: '',
    advertiser: '',
    product: '',
    title: ''
  },
  termsAndConditions: ''
};

interface ProjectCardProps {
  project: Project;
  quotes: Quote[];
  quoteBudgets?: Record<string, any>;
  totalAmount?: number;
  isSelected?: boolean;
  isAdditive?: boolean;
  onClick: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onShare: (projectId: string, email: string, permissions: { canEdit: boolean; canShare: boolean }) => void;
  onUpdateSettings: (settings: Partial<QuoteSettings>) => void;
  showUnarchiveButton?: boolean;
  onUpdateQuoteStatus?: (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => void;
}

export function ProjectCard({ 
  project, 
  quotes, 
  quoteBudgets = {},
  onClick, 
  onArchive,
  onDelete,
  onShare,
  onUpdateSettings,
  showUnarchiveButton = false
}: ProjectCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const currentUser = useUserStore(state => state.currentUser);
  const { convertAmount } = useCurrencyStore();
  const isOwner = project.ownerId === currentUser?.id;
  const share = !isOwner && project.sharedWith ? project.sharedWith.find(s => s.email === currentUser?.email) : null;

  // Filtrer les budgets par statut
  const draftQuotes = quotes.filter(q => q.status === 'draft' && !q.is_deleted);
  const validatedQuotes = quotes.filter(q => q.status === 'validated' && !q.is_deleted);
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected' && !q.is_deleted);

  // Statistiques des budgets
  const quoteStats = {
    draft: draftQuotes.length,
    validated: validatedQuotes.length,
    rejected: rejectedQuotes.length,
    total: quotes.filter(q => !q.is_deleted).length
  };

  // Calculer le total HT d'un budget
  const getQuoteTotal = (quote: Quote) => {
    const budget = quoteBudgets[quote.id]?.budget || [];
    const { grandTotal = 0 } = calculateTotalCosts(budget, project.settings ?? DEFAULT_SETTINGS);
    return convertAmount(grandTotal);
  };

  // Calculer les montants totaux par statut
  const draftTotal = draftQuotes.reduce((sum, quote) => {
    return sum + getQuoteTotal(quote);
  }, 0);
  
  const validatedTotal = validatedQuotes.reduce((sum, quote) => {
    return sum + getQuoteTotal(quote);
  }, 0);
  
  const rejectedTotal = rejectedQuotes.reduce((sum, quote) => {
    return sum + getQuoteTotal(quote);
  }, 0);

  const handleShare = (email: string, permissions: { canEdit: boolean; canShare: boolean }) => {
    onShare(project.id, email, permissions);
    setIsShareModalOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-all">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{project.name}</h3>
                {/* Badge de propriété ou de partage */}
                {isOwner ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    <Building2 size={12} />
                    Propriétaire
                  </div>
                ) : share && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    <Share2 size={12} />
                    Partagé
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">{project.client}</p>

              {/* Statistiques des devis - Affichage horizontal */}
              <div className="mt-4 flex flex-wrap gap-3">
                {validatedQuotes.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={16} />
                    <span className="font-medium">{validatedQuotes.length}</span>
                    <span className="text-sm">Validés</span>
                    <span className="font-medium ml-1">{formatNumber(validatedTotal)} €</span>
                  </div>
                )}

                {draftQuotes.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                    <Clock size={16} />
                    <span className="font-medium">{draftQuotes.length}</span>
                    <span className="text-sm">En cours</span>
                    <span className="font-medium ml-1">{formatNumber(draftTotal)} €</span>
                  </div>
                )}

                {rejectedQuotes.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-full">
                    <XCircle size={16} />
                    <span className="font-medium">{rejectedQuotes.length}</span>
                    <span className="text-sm">Annulés</span>
                    <span className="font-medium ml-1">{formatNumber(rejectedTotal)} €</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Bouton de partage (uniquement pour le propriétaire) */}
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Partager le projet"
                >
                  <Share2 size={16} />
                </button>
              )}

              {/* Bouton d'archivage/désarchivage */}
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title={showUnarchiveButton ? "Désarchiver le projet" : "Archiver le projet"}
                >
                  {showUnarchiveButton ? <RotateCcw size={16} /> : <Archive size={16} />}
                </button>
              )}

              {/* Bouton de suppression */}
              {isOwner && (
                <DeleteButton
                  onDelete={onDelete}
                  itemType="project"
                  compact
                />
              )}
            </div>
          </div>

          {/* Informations de partage */}
          {!isOwner && share && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <UserCircle size={14} />
                <span>
                  Partagé par {share.sharedBy.firstName} {share.sharedBy.lastName}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                {share.permissions.canEdit && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                    Peut modifier
                  </span>
                )}
                {share.permissions.canShare && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                    Peut partager
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Liste des partages si propriétaire */}
          {isOwner && project.sharedWith && project.sharedWith.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Share2 size={14} />
                <span>Partagé avec {project.sharedWith.length} utilisateur{project.sharedWith.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.sharedWith.map(share => (
                  <div key={share.email} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {share.email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClick}
          className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100 transition-colors"
        >
          Ouvrir le projet
        </button>
      </div>

      {/* Modal de partage */}
      <ShareProjectModal
        project={project}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShare}
      />
    </>
  );
}