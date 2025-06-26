import React from 'react';
import { Project, Quote } from '../../types/project';
import { ProjectCard } from './ProjectCard';
import { Plus, FileText } from 'lucide-react';
import { QuoteSettings } from '../../types/quoteSettings';

interface ProjectListProps {
  projects: Project[];
  quotes: Quote[];
  quoteBudgets?: Record<string, any[]>;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onArchiveProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onShare: (projectId: string, email: string, permissions: { canEdit: boolean; canShare: boolean }) => void;
  onUpdateSettings: (projectId: string, settings: Partial<QuoteSettings>) => void;
  showUnarchiveButton?: boolean;
}

export function ProjectList({
  projects,
  quotes,
  quoteBudgets = {},
  onSelectProject,
  onCreateProject,
  onArchiveProject,
  onDeleteProject,
  onShare,
  onUpdateSettings,
  showUnarchiveButton = false
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <FileText size={48} className="mx-auto text-gray-400 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">
          Aucun projet
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Commencez par créer votre premier projet
        </p>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
        >
          <Plus size={16} />
          Créer mon premier projet
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          quotes={quotes.filter(q => q.projectId === project.id)}
          quoteBudgets={quoteBudgets}
          onClick={() => onSelectProject(project)}
          onArchive={() => onArchiveProject(project.id)}
          onDelete={() => onDeleteProject(project.id)}
          onShare={onShare}
          onUpdateSettings={(settings) => onUpdateSettings(project.id, settings)}
          showUnarchiveButton={showUnarchiveButton}
        />
      ))}
    </div>
  );
}