import React, { useState, useEffect } from 'react';
import { useUserStore } from './stores/userStore';
import { Project, Quote, QuoteStatus } from './types/project';
import { LoginForm } from './components/auth/LoginForm';
import { ProjectsHome } from './components/projects/ProjectsHome';
import { ProjectView } from './components/projects/ProjectView';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { useProjects } from './hooks/useProjects';
import { useQuotes } from './hooks/useQuotes';
import { useQuoteSettings } from './hooks/useQuoteSettings';
import { BudgetItemType, BudgetLine, BudgetCategory } from './types/budget';
import { QuoteSettings } from './types/quoteSettings';
import { Header } from './components/layout/Header';
import { useCurrencyStore } from './stores/currencyStore';
import { useTemplatesStore } from './stores/templatesStore';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { TestPage } from './components/TestPage';

export default function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTestPage, setShowTestPage] = useState(false);

  try {
    const { currentUser, loadUserData } = useUserStore(state => ({
      currentUser: state.currentUser,
      loadUserData: state.loadUserData
    }));
    const projectStore = useProjects();
    const quoteStore = useQuotes();
    const currencyStore = useCurrencyStore();
    const templatesStore = useTemplatesStore();

    // Load user data and projects on startup
    useEffect(() => {
      const loadInitialData = async () => {
        try {
          setIsLoading(true);
          setIsDataLoaded(false);
          setError(null);
          
          // First load user data if not already loaded
          if (!currentUser) {
            await loadUserData();
          }
          
          // Then load projects if user is authenticated
          if (currentUser || useUserStore.getState().currentUser) {
            await projectStore.loadProjects();
            await templatesStore.loadTemplates();
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error loading initial data:', err);
          setError(err instanceof Error ? err.message : 'Erreur de chargement');
          setIsLoading(false);
        }
      };
      
      loadInitialData();
    }, []);

    // Set data loaded state when quotes are loaded
    useEffect(() => {
      if (!isLoading && quoteStore.quotes.length > 0) {
        setIsDataLoaded(true);
      }
      // Also set data loaded if loading is complete but there are no quotes
      // This handles the case of new users or projects with no quotes
      else if (!isLoading && !projectStore.isLoading) {
        setIsDataLoaded(true);
      }
    }, [isLoading, quoteStore.quotes]);
    // Set default status for all quotes
    useEffect(() => {
      if (quoteStore.quotes.length > 0) {
        quoteStore.quotes.forEach(quote => {
          if (!quote.status) {
            quoteStore.updateQuoteStatus(quote.id, 'draft');
          }
        });
      }
    }, [quoteStore.quotes]);

    // Listen for navigation events from the dashboard
    useEffect(() => {
      const handleNavigateToProject = (event: Event) => {
        const customEvent = event as CustomEvent<Project>;
        if (customEvent.detail) {
          setSelectedProject(customEvent.detail);
          setShowDashboard(false);
        }
      };

      window.addEventListener('navigate-to-project', handleNavigateToProject);
      
      return () => {
        window.removeEventListener('navigate-to-project', handleNavigateToProject);
      };
    }, []);

    useEffect(() => {
      // Force le chargement des devises au démarrage
      useCurrencyStore.getState().fetchExchangeRates();
    }, []);

    const handleCreateProject = async (projectData: { 
      name: string; 
      client: string;
      settings?: Partial<QuoteSettings>;
    }) => {
      try {
        const newProject = await projectStore.createProject(projectData);
        setSelectedProject(newProject);
        setSelectedQuote(null);
        setIsCreateModalOpen(false);
        setShowDashboard(false);
        // Load quotes for the new project
        await quoteStore.loadQuotes(newProject.id);
      } catch (error) {
        console.error('Error creating project:', error);
      }
    };

    const handleCreateQuote = async (data: { 
      name: string; 
      type: 'main' | 'additive'; 
      parentQuoteId?: string; 
      initialBudget?: BudgetCategory[];
      settings?: Partial<QuoteSettings>;
    }) => {
      if (!selectedProject) {
        console.error('Cannot create quote: no project selected');
        return;
      }

      const trimmedName = data.name?.trim();
      if (!trimmedName) {
        return; // Let the CreateQuoteModal handle the validation error
      }

      try {
        const newQuote = await quoteStore.createQuote({
          projectId: selectedProject.id,
          name: trimmedName,
          type: data.type,
          parentQuoteId: data.parentQuoteId,
          initialBudget: data.initialBudget || [],
          settings: data.settings
        });

        setSelectedQuote(newQuote);
        // Reload quotes after creation to ensure everything is in sync
        await quoteStore.loadQuotes(selectedProject.id);
        
        return newQuote;
      } catch (error) {
        console.error('Error creating quote:', error);
        throw error;
      }
    };

    const handleUpdateQuoteStatus = (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => {
      quoteStore.updateQuoteStatus(quoteId, status, details);
    };

    const handleUpdateQuoteParent = (quoteId: string, newParentId: string) => {
      quoteStore.updateQuoteParent(quoteId, newParentId);
    };

    const handleArchiveProject = (projectId: string, archived: boolean) => {
      projectStore.updateProject(projectId, { archived });
    };

    const handleBack = () => {
      if (selectedQuote) {
        setSelectedQuote(null);
      } else {
        setSelectedProject(null);
        setShowDashboard(true);
      }
    };

    const handleDeleteProject = async (projectId: string) => {
      try {
        await projectStore.deleteProject(projectId);
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
          setSelectedQuote(null);
          setShowDashboard(true);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    };

    const handleDeleteQuote = async (quoteId: string) => {
      try {
        await quoteStore.deleteQuote(quoteId);
        
        // Clear selection if deleted quote was selected
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(null);
        }
      } catch (error) {
        console.error('Error deleting quote:', error);
      }
    };

    const handleViewAllProjects = () => {
      setShowDashboard(false);
    };

    // Toggle test page
    const toggleTestPage = () => {
      setShowTestPage(!showTestPage);
    };

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <div className="min-h-screen bg-gray-50">
          <LoginForm onSuccess={() => {}} />
        </div>
      );
    }

    if (isLoading || !isDataLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      );
    }

    if (showTestPage) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header title="Test de connexion Supabase" />
          <div className="py-4">
            <div className="max-w-7xl mx-auto px-4 flex justify-end mb-4">
              <button
                onClick={toggleTestPage}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retour à l'application
              </button>
            </div>
            <TestPage />
          </div>
        </div>
      );
    }

    const accessibleProjects = projectStore.getAccessibleProjects();

    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={selectedProject ? selectedProject.name : "Budget Production Audiovisuelle"} />
        
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-end">
          <button
            onClick={toggleTestPage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tester la connexion Supabase
          </button>
        </div>
        
        {selectedProject ? (
          <div className="py-4">
            <ProjectView
              project={selectedProject}
              quotes={quoteStore.getProjectQuotes(selectedProject.id)}
              selectedQuote={selectedQuote}
              onBack={handleBack}
              onSelectQuote={setSelectedQuote}
              onCreateQuote={handleCreateQuote}
              onUpdateQuoteStatus={handleUpdateQuoteStatus}
              onUpdateQuoteParent={handleUpdateQuoteParent}
              onUpdateSettings={(settings) => projectStore.updateProjectSettings(selectedProject.id, settings)}
              onDeleteQuote={handleDeleteQuote}
            />
          </div>
        ) : showDashboard ? (
          <DashboardOverview onViewAllProjects={handleViewAllProjects} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <ProjectsHome
              projects={accessibleProjects}
              quotes={quoteStore.quotes}
              budgets={Object.fromEntries(
                Object.entries(quoteStore.quotesData).map(([quoteId, data]) => [
                  quoteId, 
                  data.budget || []
                ])
              )}
              onSelectProject={(project) => {
                setSelectedProject(project);
                setShowDashboard(false);
              }}
              onCreateProject={() => setIsCreateModalOpen(true)}
              onArchiveProject={handleArchiveProject}
              onUpdateSettings={(projectId, settings) => projectStore.updateProjectSettings(projectId, settings)}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        )}

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      </div>
    );
  } catch (err) {
    console.error('Error in App component:', err);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Erreur de rendu</h1>
          <p className="text-gray-600 mb-4">{err instanceof Error ? err.message : 'Erreur inconnue'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
}