import React, { useEffect, useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useQuotes } from '../../hooks/useQuotes';
import { Project, Quote, QuoteStatus } from '../../types/project';
import { formatNumber } from '../../utils/formatNumber';
import { calculateTotalCosts } from '../../utils/budgetCalculations/totals';
import { CheckCircle2, Clock, XCircle, ArrowRight, Calendar, ChevronDown } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { CurrencyDisplay } from '../budget/CurrencyDisplay';
import { useCurrencyStore } from '../../stores/currencyStore';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectSummary {
  project: Project;
  quotes: {
    draft: Quote[];
    validated: Quote[];
    rejected: Quote[];
  };
  totals: {
    draft: number;
    validated: number;
    rejected: number;
    total: number;
  };
}

type DateRange = 'all' | 'current-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'last-year' | 'custom';

interface DateFilter {
  range: DateRange;
  startDate?: Date;
  endDate?: Date;
}

export function DashboardOverview({ onViewAllProjects }: { onViewAllProjects: () => void }) {
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ range: 'all' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(subMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  const { projects, loadProjects, getAccessibleProjects } = useProjects();
  const { quotes, quotesData, loadQuotes } = useQuotes();
  const currentUser = useUserStore(state => state.currentUser);
  const { convertAmount } = useCurrencyStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (currentUser) {
        await loadProjects();
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [currentUser, loadProjects]);

  useEffect(() => {
    const loadQuotesForProjects = async () => {
      // Get only projects accessible to the current user
      const accessibleProjects = getAccessibleProjects();
      for (const project of accessibleProjects) {
        await loadQuotes(project.id, project.settings);
      }
    };
    
    if (projects.length > 0) {
      loadQuotesForProjects();
    }
  }, [projects, loadQuotes, getAccessibleProjects]);

  useEffect(() => {
    if (projects.length > 0 && quotes.length > 0) {
      // Get only projects accessible to the current user
      const accessibleProjects = getAccessibleProjects();
      
      const summaries: ProjectSummary[] = accessibleProjects
        .filter(p => !p.archived)
        .map(project => {
          // Filter quotes to only include those for this project and not deleted
          const projectQuotes = quotes.filter(q => q.projectId === project.id && !q.is_deleted);
          
          const draftQuotes = projectQuotes.filter(q => q.status === 'draft');
          const validatedQuotes = projectQuotes.filter(q => q.status === 'validated');
          const rejectedQuotes = projectQuotes.filter(q => q.status === 'rejected');
          
          // Calculate totals for each status
          const calculateTotal = (statusQuotes: Quote[]) => {
            return statusQuotes.reduce((sum, quote) => {
              const budget = quotesData[quote.id]?.budget || [];
              const { grandTotal = 0 } = calculateTotalCosts(budget, project.settings);
              return sum + convertAmount(grandTotal);
            }, 0);
          };
          
          const draftTotal = calculateTotal(draftQuotes);
          const validatedTotal = calculateTotal(validatedQuotes);
          const rejectedTotal = calculateTotal(rejectedQuotes);
          
          return {
            project,
            quotes: {
              draft: draftQuotes,
              validated: validatedQuotes,
              rejected: rejectedQuotes
            },
            totals: {
              draft: draftTotal,
              validated: validatedTotal,
              rejected: rejectedTotal,
              total: draftTotal + validatedTotal + rejectedTotal
            }
          };
        })
        .sort((a, b) => {
          // Sort by creation date, newest first
          return new Date(b.project.createdAt).getTime() - new Date(a.project.createdAt).getTime();
        });
      
      setProjectSummaries(summaries);
    }
  }, [projects, quotes, quotesData, convertAmount, getAccessibleProjects]);

  // Apply date filter
  useEffect(() => {
    if (projectSummaries.length === 0) {
      setFilteredSummaries([]);
      return;
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const now = new Date();

    switch (dateFilter.range) {
      case 'current-month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last-month':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'last-3-months':
        startDate = subMonths(now, 3);
        endDate = now;
        break;
      case 'last-6-months':
        startDate = subMonths(now, 6);
        endDate = now;
        break;
      case 'last-year':
        startDate = subMonths(now, 12);
        endDate = now;
        break;
      case 'custom':
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
        break;
      case 'all':
      default:
        // No date filtering
        setFilteredSummaries(projectSummaries);
        return;
    }

    if (startDate && endDate) {
      // Filter quotes by creation date
      const filtered = projectSummaries.map(summary => {
        const filterQuotesByDate = (quoteList: Quote[]) => {
          return quoteList.filter(quote => {
            const quoteDate = new Date(quote.createdAt);
            return isWithinInterval(quoteDate, { start: startDate!, end: endDate! });
          });
        };

        const filteredDraftQuotes = filterQuotesByDate(summary.quotes.draft);
        const filteredValidatedQuotes = filterQuotesByDate(summary.quotes.validated);
        const filteredRejectedQuotes = filterQuotesByDate(summary.quotes.rejected);

        // Calculate totals for filtered quotes
        const calculateTotal = (statusQuotes: Quote[]) => {
          return statusQuotes.reduce((sum, quote) => {
            const budget = quotesData[quote.id]?.budget || [];
            const { grandTotal = 0 } = calculateTotalCosts(budget, summary.project.settings);
            return sum + convertAmount(grandTotal);
          }, 0);
        };

        const draftTotal = calculateTotal(filteredDraftQuotes);
        const validatedTotal = calculateTotal(filteredValidatedQuotes);
        const rejectedTotal = calculateTotal(filteredRejectedQuotes);

        return {
          project: summary.project,
          quotes: {
            draft: filteredDraftQuotes,
            validated: filteredValidatedQuotes,
            rejected: filteredRejectedQuotes
          },
          totals: {
            draft: draftTotal,
            validated: validatedTotal,
            rejected: rejectedTotal,
            total: draftTotal + validatedTotal + rejectedTotal
          }
        };
      }).filter(summary => 
        summary.quotes.draft.length > 0 || 
        summary.quotes.validated.length > 0 || 
        summary.quotes.rejected.length > 0
      );

      setFilteredSummaries(filtered);
    } else {
      setFilteredSummaries(projectSummaries);
    }
  }, [projectSummaries, dateFilter, quotesData]);

  const handleDateRangeChange = (range: DateRange) => {
    if (range === 'custom') {
      setShowDatePicker(true);
      setDateFilter({ range });
    } else {
      setShowDatePicker(false);
      setDateFilter({ range });
    }
  };

  const applyCustomDateRange = () => {
    try {
      // Parse dates from string inputs
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      
      // Set time to end of day for end date
      endDate.setHours(23, 59, 59, 999);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid date format');
        return;
      }
      
      // Apply the filter
      setDateFilter({
        range: 'custom',
        startDate,
        endDate
      });
      
      // Close the date picker
      setShowDatePicker(false);
    } catch (error) {
      console.error('Error applying custom date range:', error);
    }
  };

  // Calculate global totals from filtered summaries
  const globalTotals = filteredSummaries.reduce(
    (acc, summary) => {
      return {
        draft: acc.draft + summary.totals.draft,
        validated: acc.validated + summary.totals.validated,
        rejected: acc.rejected + summary.totals.rejected,
        total: acc.total + summary.totals.total
      };
    },
    { draft: 0, validated: 0, rejected: 0, total: 0 }
  );

  const validatedCount = filteredSummaries.reduce(
    (count, summary) => count + summary.quotes.validated.length,
    0
  );

  const draftCount = filteredSummaries.reduce(
    (count, summary) => count + summary.quotes.draft.length,
    0
  );

  const rejectedCount = filteredSummaries.reduce(
    (count, summary) => count + summary.quotes.rejected.length,
    0
  );

  const getDateRangeLabel = () => {
    switch (dateFilter.range) {
      case 'current-month':
        return `Mois courant (${format(new Date(), 'MMMM yyyy', { locale: fr })})`;
      case 'last-month':
        return `Mois dernier (${format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: fr })})`;
      case 'last-3-months':
        return 'Derniers 3 mois';
      case 'last-6-months':
        return 'Derniers 6 mois';
      case 'last-year':
        return 'Dernière année';
      case 'custom':
        if (dateFilter.startDate && dateFilter.endDate) {
          return `${format(dateFilter.startDate, 'dd/MM/yyyy')} - ${format(dateFilter.endDate, 'dd/MM/yyyy')}`;
        }
        return 'Période personnalisée';
      case 'all':
      default:
        return 'Toutes les périodes';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {currentUser?.role === 'production' 
          ? `${currentUser.productionName || 'Ma société de production'}`
          : 'Mon tableau de bord'
        }
      </h1>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Ma situation</h2>
          
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Calendar size={16} />
              <span>{getDateRangeLabel()}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                <div className="space-y-2">
                  <div className="font-medium text-gray-700 mb-2">Période</div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dateRange"
                        checked={dateFilter.range === 'all'}
                        onChange={() => handleDateRangeChange('all')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Toutes les périodes</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dateRange"
                        checked={dateFilter.range === 'current-month'}
                        onChange={() => handleDateRangeChange('current-month')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Mois courant</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dateRange"
                        checked={dateFilter.range === 'last-month'}
                        onChange={() => handleDateRangeChange('last-month')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Mois dernier</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dateRange"
                        checked={dateFilter.range === 'last-3-months'}
                        onChange={() => handleDateRangeChange('last-3-months')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Derniers 3 mois</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dateRange"
                        checked={dateFilter.range === 'last-6-months'}
                        onChange={() => handleDateRangeChange('last-6-months')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Derniers 6 mois</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dateRange"
                        checked={dateFilter.range === 'last-year'}
                        onChange={() => handleDateRangeChange('last-year')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Dernière année</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dateRange"
                        checked={dateFilter.range === 'custom'}
                        onChange={() => handleDateRangeChange('custom')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Période personnalisée</span>
                    </label>
                  </div>
                  
                  {dateFilter.range === 'custom' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <button
                        onClick={applyCustomDateRange}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                      >
                        Appliquer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="text-green-600 font-medium">{validatedCount} confirmés</div>
              <div className="text-4xl font-bold text-green-500">
                {formatNumber(globalTotals.validated)} <CurrencyDisplay />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-blue-600 font-medium">{draftCount} en cours</div>
              <div className="text-4xl font-bold text-blue-500">
                {formatNumber(globalTotals.draft)} <CurrencyDisplay />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-red-600 font-medium">{rejectedCount} annulés</div>
              <div className="text-4xl font-bold text-red-500">
                {formatNumber(globalTotals.rejected)} <CurrencyDisplay />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Mes projets</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSummaries.slice(0, 6).map((summary) => (
            <div 
              key={summary.project.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{summary.project.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{summary.project.client}</p>
                
                <div className="space-y-2">
                  {summary.quotes.validated.length > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 size={16} />
                        <span className="text-sm">Validés</span>
                      </div>
                      <span className="font-medium">
                        {formatNumber(summary.totals.validated)} <CurrencyDisplay />
                      </span>
                    </div>
                  )}
                  
                  {summary.quotes.draft.length > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock size={16} />
                        <span className="text-sm">En cours</span>
                      </div>
                      <span className="font-medium">
                        {formatNumber(summary.totals.draft)} <CurrencyDisplay />
                      </span>
                    </div>
                  )}
                  
                  {summary.quotes.rejected.length > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle size={16} />
                        <span className="text-sm">Annulés</span>
                      </div>
                      <span className="font-medium">
                        {formatNumber(summary.totals.rejected)} <CurrencyDisplay />
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-100">
                <button 
                  onClick={() => {
                    // Naviguer vers le projet spécifique
                    window.dispatchEvent(new CustomEvent('navigate-to-project', { detail: summary.project }));
                  }}
                  className="w-full py-2 px-4 text-blue-600 hover:bg-blue-50 text-sm font-medium flex items-center justify-center gap-1"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {filteredSummaries.length === 0 && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet pour cette période</h3>
            <p className="text-gray-500 mb-4">Aucun projet ne correspond à la période sélectionnée.</p>
            <button
              onClick={() => setDateFilter({ range: 'all' })}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Voir tous les projets
            </button>
          </div>
        )}
      </div>
      
      <div className="text-center mt-8">
        <button
          onClick={onViewAllProjects}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
        >
          Ouvrir tous les projets
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}