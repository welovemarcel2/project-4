import React, { useState, useEffect, useRef } from 'react';
import { Project, Quote } from '../../types/project';
import { ProjectList } from './ProjectList';
import { useUserStore } from '../../stores/userStore';
import { useProjects } from '../../hooks/useProjects';
import { Plus, Archive, AlertCircle } from 'lucide-react';
import { useQuoteStore } from '../../hooks/useQuotes';
import { QuoteSettings } from '../../types/quoteSettings';

interface ProjectsHomeProps {
  projects: Project[];
  quotes: Quote[];
  budgets?: Record<string, any[]>;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onArchiveProject: (projectId: string, archived: boolean) => void;
  onUpdateSettings: (projectId: string, settings: Partial<QuoteSettings>) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectsHome({
  projects,
  quotes,
  budgets,
  onSelectProject,
  onCreateProject,
  onArchiveProject,
  onUpdateSettings,
  onDeleteProject
}: ProjectsHomeProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = useUserStore(state => state.currentUser);
  const { shareProject, checkDeletedProjects } = useProjects();
  const { quotesData, loadQuotes, getQuoteBudget } = useQuoteStore();
  const loadedProjectsRef = useRef(new Set<string>());
  const [pendingQuotes, setPendingQuotes] = useState<string[]>([]);

  // Vérifier les projets supprimés périodiquement
  useEffect(() => {
    // Vérifier au chargement initial
    checkDeletedProjects();
    
    // Puis vérifier toutes les 30 secondes
    const interval = setInterval(() => {
      checkDeletedProjects();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [checkDeletedProjects]);

  // Load quotes for projects that haven't been loaded yet
  useEffect(() => {
    const loadProjectQuotes = async () => {
      setIsLoading(true);
      const loadedProjects = loadedProjectsRef.current;
      
      // Find projects that haven't been loaded yet
      const projectsToLoad = projects.filter(p => p?.id && !loadedProjects.has(p.id));
      
      // If there are no projects to load, return early
      if (projectsToLoad.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // Load quotes for each project one by one
      for (const project of projectsToLoad) {
        try {
          await loadQuotes(project.id);
          loadedProjects.add(project.id);
        } catch (error) {
          console.error(`Error loading quotes for project ${project.id}:`, error);
        }
      }
      
      // After loading all projects, check for quotes that need budgets
      const allQuotes = Object.values(quotesData).map(data => data.quote);
      const quotesToLoad = allQuotes.filter(q => q?.id && !quotesData[q.id]?.budget?.length);
      
      if (quotesToLoad.length > 0) {
        setPendingQuotes(quotesToLoad.map(q => q.id));
      }
      
      setIsLoading(false);
    };
    
    if (projects.length > 0) {
      loadProjectQuotes();
    }
  }, [projects, loadQuotes, quotesData]);

  // Load budgets for quotes that need them
  useEffect(() => {
    const loadQuoteBudgets = async () => {
      if (pendingQuotes.length === 0) return;
      
      // Take the first quote from the pending list
      const quoteId = pendingQuotes[0];
      
      try {
        await getQuoteBudget(quoteId);
      } catch (error) {
        console.error(`Error loading budget for quote ${quoteId}:`, error);
      }
      
      // Remove the processed quote from the pending list
      setPendingQuotes(prev => prev.filter(id => id !== quoteId));
    };
    
    loadQuoteBudgets();
  }, [pendingQuotes, getQuoteBudget]);

  // Separate projects into categories
  const ownedProjects = projects.filter(p => p.ownerId === currentUser?.id);
  const sharedProjects = projects.filter(p => {
    if (p.ownerId === currentUser?.id) return false;
    return p.sharedWith?.some(s => s.email === currentUser?.email);
  });

  // Filter projects according to their archive state
  const filteredOwnedProjects = ownedProjects.filter(p => p.archived === showArchived);
  
  // Count archived projects
  const archivedCount = ownedProjects.filter(p => p.archived).length;

  const handleShare = (projectId: string, email: string, permissions: { canEdit: boolean; canShare: boolean }) => {
    shareProject(projectId, email, permissions);
  };

  const handleUpdateSettings = (projectId: string, settings: Partial<QuoteSettings>) => {
    onUpdateSettings(projectId, settings);
  };

  const handleArchiveProject = (projectId: string) => {
    onArchiveProject(projectId, !showArchived);
  };

  // Sort projects by creation date (newest first)
  const sortedOwnedProjects = [...filteredOwnedProjects].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const sortedSharedProjects = [...sharedProjects].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Created Projects */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {showArchived ? 'Projets archivés' : 'Mes projets'}
            </h2>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                showArchived
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Archive size={16} />
              {showArchived ? 'Voir les projets actifs' : `Archives (${archivedCount})`}
            </button>
          </div>
          {!showArchived && (
            <button
              onClick={onCreateProject}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              <Plus size={16} />
              Nouveau projet
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {showArchived && archivedCount === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  Aucun projet archivé
                </h3>
                <p className="text-sm text-gray-500">
                  Les projets que vous archivez apparaîtront ici
                </p>
              </div>
            )}

            {(archivedCount > 0 || !showArchived) && (
              <ProjectList
                projects={sortedOwnedProjects}
                quotes={quotes}
                quoteBudgets={quotesData}
                onSelectProject={onSelectProject}
                onCreateProject={onCreateProject}
                onArchiveProject={handleArchiveProject}
                onDeleteProject={onDeleteProject}
                onShare={handleShare}
                onUpdateSettings={handleUpdateSettings}
                showUnarchiveButton={showArchived}
              />
            )}
          </>
        )}
      </div>

      {/* Shared Projects */}
      {!showArchived && sharedProjects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Projets partagés avec moi</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <ProjectList
              projects={sortedSharedProjects}
              quotes={quotes}
              quoteBudgets={quotesData}
              onSelectProject={onSelectProject}
              onCreateProject={onCreateProject}
              onArchiveProject={handleArchiveProject}
              onDeleteProject={onDeleteProject}
              onShare={handleShare}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </div>
      )}
    </div>
  );
}