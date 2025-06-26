import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Project, ProjectShare } from '../types/project';
import { QuoteSettings, DEFAULT_SETTINGS } from '../types/quoteSettings';
import { useUserStore } from '../stores/userStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { generateId } from '../utils/generateId';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  createProject: (data: { name: string; client: string; settings?: Partial<QuoteSettings> }) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  updateProjectSettings: (id: string, settings: Partial<QuoteSettings>) => Promise<void>;
  shareProject: (projectId: string, email: string, permissions: { canEdit: boolean; canShare: boolean }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getAccessibleProjects: () => Project[];
  checkDeletedProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      isLoading: false,
      error: null,

      loadProjects: async () => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return;

        try {
          set({ isLoading: true, error: null });

          // First, fetch basic project data and shares
          const { data: ownedProjects, error: ownedError } = await supabase
            .from('projects')
            .select(`
              *,
              project_settings (*),
              shares:project_shares (
                user_id,
                shared_by_id,
                can_edit,
                can_share,
                created_at,
                shared_user:users!project_shares_user_id_fkey (
                  email,
                  first_name,
                  last_name
                ),
                shared_by:users!project_shares_shared_by_id_fkey (
                  id,
                  email,
                  first_name,
                  last_name
                )
              )
            `)
            .eq('owner_id', currentUser.id)
            .eq('archived', false);

          if (ownedError) throw ownedError;

          const { data: sharedProjects, error: sharedError } = await supabase
            .from('projects')
            .select(`
              *,
              project_settings (*),
              shares:project_shares (
                user_id,
                shared_by_id,
                can_edit,
                can_share,
                created_at,
                shared_user:users!project_shares_user_id_fkey (
                  email,
                  first_name,
                  last_name
                ),
                shared_by:users!project_shares_shared_by_id_fkey (
                  id,
                  email,
                  first_name,
                  last_name
                )
              )
            `)
            .neq('owner_id', currentUser.id)
            .eq('archived', false)
            .eq('project_shares.user_id', currentUser.id);

          if (sharedError) throw sharedError;

          const allProjectsBasic = [...(ownedProjects || []), ...(sharedProjects || [])];
          
          // If there are no projects, return early
          if (allProjectsBasic.length === 0) {
            set({ projects: [], isLoading: false });
            return;
          }

          // Get all project IDs
          const projectIds = allProjectsBasic.map(p => p.id);

          // Fetch additional data in parallel
          const [
            { data: producers },
            { data: informations },
            { data: rates },
            { data: socialCharges },
            { data: currencies }
          ] = await Promise.all([
            supabase.from('project_producers').select('*').in('project_id', projectIds),
            supabase.from('project_informations').select('*').in('project_id', projectIds),
            supabase.from('project_rates').select('*').in('project_id', projectIds),
            supabase.from('project_social_charges').select('*').in('project_id', projectIds),
            supabase.from('project_currencies').select('*').in('project_id', projectIds)
          ]);

          // Create lookup maps for related data
          const producersMap = new Map(producers?.map(p => [p.project_id, p]));
          const informationsMap = new Map(informations?.map(i => [i.project_id, i]));
          const ratesMap = new Map(rates?.map(r => [r.project_id, r]));
          const socialChargesMap = new Map(socialCharges?.map(s => [s.project_id, s]));
          const currenciesMap = new Map(currencies?.map(c => [c.project_id, c]));

          // Transform the data
          const transformProject = (projectData: any): Project => {
            const mergedSettings: QuoteSettings = {
              ...DEFAULT_SETTINGS,
              ...(projectData.project_settings || {}),
            };

            // Get related data from maps
            const projectRates = ratesMap.get(projectData.id);
            const projectSocialCharges = socialChargesMap.get(projectData.id);
            const projectSettings = projectData.project_settings;
            const projectCurrencies = currenciesMap.get(projectData.id);
            const projectInformations = informationsMap.get(projectData.id);
            const projectProducers = producersMap.get(projectData.id);

            if (projectRates) {
              mergedSettings.defaultAgencyPercent = projectRates.default_agency_percent || DEFAULT_SETTINGS.defaultAgencyPercent;
              mergedSettings.defaultMarginPercent = projectRates.default_margin_percent || DEFAULT_SETTINGS.defaultMarginPercent;
              mergedSettings.rateLabels = projectRates.rate_labels || DEFAULT_SETTINGS.rateLabels;
            }

            if (projectSocialCharges) {
              mergedSettings.socialChargeRates = projectSocialCharges.social_charge_rates || DEFAULT_SETTINGS.socialChargeRates;
            }

            if (projectSettings) {
              mergedSettings.availableUnits = projectSettings.available_units || DEFAULT_SETTINGS.availableUnits;
              mergedSettings.showEmptyItems = projectSettings.show_empty_items !== undefined ? 
                projectSettings.show_empty_items : DEFAULT_SETTINGS.showEmptyItems;
              mergedSettings.socialChargesDisplay = projectSettings.social_charges_display || DEFAULT_SETTINGS.socialChargesDisplay;
              mergedSettings.applySocialChargesMargins = projectSettings.apply_social_charges_margins !== undefined ? 
                projectSettings.apply_social_charges_margins : DEFAULT_SETTINGS.applySocialChargesMargins;
            }

            if (projectCurrencies) {
              mergedSettings.selectedCurrency = projectCurrencies.selected_currency;
              mergedSettings.currencies = projectCurrencies.currencies;
            }

            if (projectInformations) {
              mergedSettings.information = {
                ...DEFAULT_SETTINGS.information,
                projectName: projectData.name,
                projectType: projectData.client,
                agency: projectInformations.agency || '',
                advertiser: projectInformations.advertiser || '',
                product: projectInformations.product || '',
                title: projectInformations.title || '',
                customFields: projectInformations.custom_fields || DEFAULT_SETTINGS.information.customFields
              };
            }

            if (projectProducers) {
              mergedSettings.production = {
                ...DEFAULT_SETTINGS.production,
                producer: projectProducers.producer || '',
                productionManager: projectProducers.production_manager || ''
              };
            }

            return {
              id: projectData.id,
              name: projectData.name,
              client: projectData.client,
              settings: mergedSettings,
              ownerId: projectData.owner_id,
              sharedWith: projectData.shares?.map((share: any) => ({
                email: share.shared_user.email,
                sharedBy: {
                  id: share.shared_by_id,
                  firstName: share.shared_by.first_name,
                  lastName: share.shared_by.last_name,
                  email: share.shared_by.email
                },
                sharedAt: new Date(share.created_at),
                permissions: {
                  canEdit: share.can_edit,
                  canShare: share.can_share
                }
              })) || [],
              createdAt: new Date(projectData.created_at),
              updatedAt: new Date(projectData.updated_at),
              archived: projectData.archived || false,
              producersId: projectData.producers_id,
              informationsId: projectData.informations_id,
              ratesId: projectData.rates_id,
              socialChargesId: projectData.social_charges_id,
              currenciesId: projectData.currencies_id
            };
          };

          const allProjects = allProjectsBasic.map(transformProject);

          set({ projects: allProjects, isLoading: false });
          
          // Check for deleted projects
          await get().checkDeletedProjects();
        } catch (error) {
          console.error('Error loading projects:', error);
          set({ error: 'Erreur lors du chargement des projets', isLoading: false });
        }
      },

      checkDeletedProjects: async () => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return;
        
        try {
          const currentProjects = get().projects;
          
          // Check only shared projects (not those owned by the user)
          const sharedProjects = currentProjects.filter(p => p.ownerId !== currentUser.id);
          
          if (sharedProjects.length === 0) return;
          
          // Check if shared projects still exist in the database
          const { data: existingProjects, error } = await supabase
            .from('projects')
            .select('id')
            .in('id', sharedProjects.map(p => p.id));
            
          if (error) throw error;
          
          // Create a set of existing project IDs
          const existingProjectIds = new Set(existingProjects.map(p => p.id));
          
          // Filter out projects that no longer exist in the database
          const deletedProjects = sharedProjects.filter(p => !existingProjectIds.has(p.id));
          
          if (deletedProjects.length > 0) {
            // Remove deleted projects from local state
            set(state => ({
              projects: state.projects.filter(p => !deletedProjects.some(dp => dp.id === p.id))
            }));
            
            console.log(`Removed ${deletedProjects.length} deleted shared projects from local state`);
          }
        } catch (error) {
          console.error('Error checking deleted projects:', error);
        }
      },

      createProject: async (data) => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) throw new Error('User not authenticated');
        const { currencies, selectedCurrency } = useCurrencyStore.getState();

        try {
          // Create project in Supabase
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert({
              name: data.name,
              client: data.client,
              owner_id: currentUser.id,
              archived: false
            })
            .select()
            .single();

          if (projectError) throw projectError;

          // Merge default settings with provided settings
          const mergedSettings = {
            ...DEFAULT_SETTINGS,
            currencies,
            selectedCurrency,
            ...(data.settings || {}),
          };

          // Create all related tables first, then update the project with foreign keys
          let settingsId, ratesId, socialChargesId, currenciesId, informationsId, producersId;
          
          // Create project settings using upsert to handle existing records
          try {
            const { data: settingsData, error: settingsError } = await supabase
              .from('project_settings')
              .insert({
                project_id: projectData.id,
                show_empty_items: mergedSettings.showEmptyItems,
                social_charges_display: mergedSettings.socialChargesDisplay,
                available_units: mergedSettings.availableUnits,
                apply_social_charges_margins: mergedSettings.applySocialChargesMargins
              })
              .select()
              .single();

            if (settingsError) {
              console.error('Error creating project settings:', settingsError);
              // Continue despite error
            } else {
              settingsId = settingsData?.id;
            }
          } catch (settingsException) {
            console.error('Exception creating project settings:', settingsException);
            // Continue despite error
          }

          // Create project rates
          let ratesData = null;
          try {
            const { data: ratesResult, error: ratesError } = await supabase
              .from('project_rates')
              .insert({
                project_id: projectData.id,
                default_agency_percent: mergedSettings.defaultAgencyPercent,
                default_margin_percent: mergedSettings.defaultMarginPercent,
                rate_labels: mergedSettings.rateLabels
              })
              .select()
              .single();

            if (ratesError) {
              console.error('Error creating project rates:', ratesError);
              // Continue despite error
            } else {
              ratesData = ratesResult;
            }
          } catch (ratesException) {
            console.error('Exception creating project rates:', ratesException);
            // Continue despite error
          }

          // Create project social charges
          let socialChargesData = null;
          try {
            const { data: socialChargesResult, error: socialChargesError } = await supabase
              .from('project_social_charges')
              .insert({
                project_id: projectData.id,
                social_charge_rates: mergedSettings.socialChargeRates
              })
              .select()
              .single();

            if (socialChargesError) {
              console.error('Error creating project social charges:', socialChargesError);
              // Continue despite error
            } else {
              socialChargesData = socialChargesResult;
            }
          } catch (socialChargesException) {
            console.error('Exception creating project social charges:', socialChargesException);
            // Continue despite error
          }

          // Create project currencies
          let currenciesData = null;
          try {
            const { data: currenciesResult, error: currenciesError } = await supabase
              .from('project_currencies')
              .insert({
                project_id: projectData.id,
                selected_currency: mergedSettings.selectedCurrency,
                currencies: mergedSettings.currencies
              })
              .select()
              .single();

            if (currenciesError) {
              console.error('Error creating project currencies:', currenciesError);
              // Continue despite error
            } else {
              currenciesData = currenciesResult;
            }
          } catch (currenciesException) {
            console.error('Exception creating project currencies:', currenciesException);
            // Continue despite error
          }

          // Create project informations
          let informationsData = null;
          try {
            const { data: informationsResult, error: informationsError } = await supabase
              .from('project_informations')
              .insert({
                project_id: projectData.id,
                agency: mergedSettings.information?.agency || '',
                advertiser: mergedSettings.information?.advertiser || '',
                product: mergedSettings.information?.product || '',
                title: mergedSettings.information?.title || '',
                custom_fields: mergedSettings.information?.customFields || []
              })
              .select()
              .single();

            if (informationsError) {
              console.error('Error creating project informations:', informationsError);
              // Continue despite error
            } else {
              informationsData = informationsResult;
            }
          } catch (informationsException) {
            console.error('Exception creating project informations:', informationsException);
            // Continue despite error
          }

          // Create project producers
          let producersData = null;
          try {
            const { data: producersResult, error: producersError } = await supabase
              .from('project_producers')
              .insert({
                project_id: projectData.id,
                producer: mergedSettings.production?.producer || '',
                production_manager: mergedSettings.production?.productionManager || ''
              })
              .select()
              .single();

            if (producersError) {
              console.error('Error creating project producers:', producersError);
              // Continue despite error
            } else {
              producersData = producersResult;
            }
          } catch (producersException) {
            console.error('Exception creating project producers:', producersException);
            // Continue despite error
          }

          // Update project with foreign keys
          try {
            const updateData: any = {};
            
            if (ratesData?.id) updateData.rates_id = ratesData.id;
            if (socialChargesData?.id) updateData.social_charges_id = socialChargesData.id;
            if (currenciesData?.id) updateData.currencies_id = currenciesData.id;
            if (informationsData?.id) updateData.informations_id = informationsData.id;
            if (producersData?.id) updateData.producers_id = producersData.id;
            
            // Only update if we have foreign keys to update
            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabase
                .from('projects')
                .update(updateData)
                .eq('id', projectData.id);

              if (updateError) {
                console.error('Error updating project with foreign keys:', updateError);
                // Continue despite error
              }
            }
          } catch (updateException) {
            console.error('Exception updating project with foreign keys:', updateException);
            // Continue despite error
          }

          // Create project object
          const newProject: Project = {
            id: projectData.id,
            name: projectData.name,
            client: projectData.client,
            settings: mergedSettings,
            ownerId: currentUser.id,
            sharedWith: [],
            createdAt: new Date(projectData.created_at),
            updatedAt: new Date(projectData.updated_at),
            archived: false,
            producersId: producersData?.id,
            informationsId: informationsData?.id,
            ratesId: ratesData?.id,
            socialChargesId: socialChargesData?.id,
            currenciesId: currenciesData?.id
          };

          // Update local state
          set(state => ({
            projects: [...state.projects, newProject]
          }));

          return newProject;
        } catch (error) {
          console.error('Error creating project:', error);
          throw error;
        }
      },

      updateProject: async (id, updates) => {
        try {
          const { error } = await supabase
            .from('projects')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            projects: state.projects.map(project =>
              project.id === id
                ? { ...project, ...updates, updatedAt: new Date() }
                : project
            )
          }));
        } catch (error) {
          console.error('Error updating project:', error);
          throw error;
        }
      },

      updateProjectSettings: async (id, settings) => {
        try {
          const project = get().projects.find(p => p.id === id);
          if (!project) throw new Error('Project not found');

          // Update project_settings table using upsert
          try {
            // First check if a record exists
            const { data: existingSettings } = await supabase
              .from('project_settings')
              .select('id')
              .eq('project_id', id)
              .maybeSingle();
            
            if (existingSettings) {
              // Update existing record
              const { error: settingsError } = await supabase
                .from('project_settings')
                .update({
                  show_empty_items: settings.showEmptyItems,
                  social_charges_display: settings.socialChargesDisplay,
                  available_units: settings.availableUnits,
                  apply_social_charges_margins: settings.applySocialChargesMargins,
                  updated_at: new Date().toISOString()
                })
                .eq('project_id', id);

              if (settingsError) {
                console.error('Error updating project settings:', settingsError);
                // Continue despite error
              }
            } else {
              // Insert new record
              const { error: settingsError } = await supabase
                .from('project_settings')
                .insert({
                  project_id: id,
                  show_empty_items: settings.showEmptyItems,
                  social_charges_display: settings.socialChargesDisplay,
                  available_units: settings.availableUnits,
                  apply_social_charges_margins: settings.applySocialChargesMargins
                });
              
              if (settingsError) {
                console.error('Error inserting project settings:', settingsError);
                // Continue despite error
              }
            }
          } catch (settingsException) {
            console.error('Exception updating project settings:', settingsException);
            // Continue despite error
          }

          // Update project_rates table if needed
          if (settings.defaultAgencyPercent !== undefined || 
              settings.defaultMarginPercent !== undefined || 
              settings.rateLabels !== undefined) {
            
            const ratesUpdate: any = {
              project_id: id,
              updated_at: new Date().toISOString()
            };
            
            if (settings.defaultAgencyPercent !== undefined) {
              ratesUpdate.default_agency_percent = settings.defaultAgencyPercent;
            }
            if (settings.defaultMarginPercent !== undefined) {
              ratesUpdate.default_margin_percent = settings.defaultMarginPercent;
            }
            if (settings.rateLabels !== undefined) {
              ratesUpdate.rate_labels = settings.rateLabels;
            }
            
            try {
              // First check if a record exists
              const { data: existingRates } = await supabase
                .from('project_rates')
                .select('id')
                .eq('project_id', id)
                .maybeSingle();
              
              if (existingRates) {
                // Update existing record
                const { error: ratesError } = await supabase
                  .from('project_rates')
                  .update(ratesUpdate)
                  .eq('project_id', id);

                if (ratesError) {
                  console.error('Error updating project rates:', ratesError);
                  // Continue despite error
                }
              } else {
                // Insert new record
                const { error: ratesError } = await supabase
                  .from('project_rates')
                  .insert(ratesUpdate);
                
                if (ratesError) {
                  console.error('Error inserting project rates:', ratesError);
                  // Continue despite error
                }
              }
            } catch (ratesException) {
              console.error('Exception updating project rates:', ratesException);
              // Continue despite error
            }
          }

          // Update project_social_charges table if needed
          if (settings.socialChargeRates !== undefined) {
            try {
              // First check if a record exists
              const { data: existingSocialCharges } = await supabase
                .from('project_social_charges')
                .select('id')
                .eq('project_id', id)
                .maybeSingle();
              
              if (existingSocialCharges) {
                // Update existing record
                const { error: socialChargesError } = await supabase
                  .from('project_social_charges')
                  .update({
                    social_charge_rates: settings.socialChargeRates,
                    updated_at: new Date().toISOString()
                  })
                  .eq('project_id', id);

                if (socialChargesError) {
                  console.error('Error updating project social charges:', socialChargesError);
                  // Continue despite error
                }
              } else {
                // Insert new record
                const { error: socialChargesError } = await supabase
                  .from('project_social_charges')
                  .insert({
                    project_id: id,
                    social_charge_rates: settings.socialChargeRates
                  });
                
                if (socialChargesError) {
                  console.error('Error inserting project social charges:', socialChargesError);
                  // Continue despite error
                }
              }
            } catch (socialChargesException) {
              console.error('Exception updating project social charges:', socialChargesException);
              // Continue despite error
            }
          }

          // Update project_currencies table if needed
          if (settings.selectedCurrency !== undefined || settings.currencies !== undefined) {
            const currenciesUpdate: any = {
              project_id: id,
              updated_at: new Date().toISOString()
            };
            
            if (settings.selectedCurrency !== undefined) {
              currenciesUpdate.selected_currency = settings.selectedCurrency;
            }
            if (settings.currencies !== undefined) {
              currenciesUpdate.currencies = settings.currencies;
            }
            
            try {
              // First check if a record exists
              const { data: existingCurrencies } = await supabase
                .from('project_currencies')
                .select('id')
                .eq('project_id', id)
                .maybeSingle();
              
              if (existingCurrencies) {
                // Update existing record
                const { error: currenciesError } = await supabase
                  .from('project_currencies')
                  .update(currenciesUpdate)
                  .eq('project_id', id);

                if (currenciesError) {
                  console.error('Error updating project currencies:', currenciesError);
                  // Continue despite error
                }
              } else {
                // Insert new record
                const { error: currenciesError } = await supabase
                  .from('project_currencies')
                  .insert(currenciesUpdate);
                
                if (currenciesError) {
                  console.error('Error inserting project currencies:', currenciesError);
                  // Continue despite error
                }
              }
            } catch (currenciesException) {
              console.error('Exception updating project currencies:', currenciesException);
              // Continue despite error
            }
          }

          // Update project_informations table if needed
          if (settings.information !== undefined) {
            try {
              // First check if a record exists
              const { data: existingInfo } = await supabase
                .from('project_informations')
                .select('id')
                .eq('project_id', id)
                .maybeSingle();
              
              if (existingInfo) {
                // Update existing record
                const { error: informationsError } = await supabase
                  .from('project_informations')
                  .update({
                    agency: settings.information.agency,
                    advertiser: settings.information.advertiser,
                    product: settings.information.product,
                    title: settings.information.title,
                    custom_fields: settings.information.customFields,
                    updated_at: new Date().toISOString()
                  })
                  .eq('project_id', id);

                if (informationsError) {
                  console.error('Error updating project informations:', informationsError);
                  // Continue despite error
                }
              } else {
                // Insert new record
                const { error: informationsError } = await supabase
                  .from('project_informations')
                  .insert({
                    project_id: id,
                    agency: settings.information.agency,
                    advertiser: settings.information.advertiser,
                    product: settings.information.product,
                    title: settings.information.title,
                    custom_fields: settings.information.customFields
                  });
                
                if (informationsError) {
                  console.error('Error inserting project informations:', informationsError);
                  // Continue despite error
                }
              }
            } catch (informationsException) {
              console.error('Exception updating project informations:', informationsException);
              // Continue despite error
            }
          }

          // Update project_producers table if needed
          if (settings.production !== undefined) {
            try {
              // First check if a record exists
              const { data: existingProducers } = await supabase
                .from('project_producers')
                .select('id')
                .eq('project_id', id)
                .maybeSingle();
              
              if (existingProducers) {
                // Update existing record
                const { error: producersError } = await supabase
                  .from('project_producers')
                  .update({
                    producer: settings.production.producer,
                    production_manager: settings.production.productionManager,
                    updated_at: new Date().toISOString()
                  })
                  .eq('project_id', id);

                if (producersError) {
                  console.error('Error updating project producers:', producersError);
                }
              } else {
                // Insert new record
                const { error: producersError } = await supabase
                  .from('project_producers')
                  .insert({
                    project_id: id,
                    producer: settings.production.producer,
                    production_manager: settings.production.productionManager
                  });
                
                if (producersError) {
                  console.error('Error inserting project producers:', producersError);
                }
              }
            } catch (producersException) {
              console.error('Exception updating project producers:', producersException);
              // Continue despite error
            }
          }

          // Update local state
          set(state => ({
            projects: state.projects.map(project =>
              project.id === id
                ? {
                    ...project,
                    settings: { ...project.settings, ...settings },
                    updatedAt: new Date()
                  }
                : project
            )
          }));
        } catch (error) {
          console.error('Error updating project settings:', error);
          throw error;
        }
      },

      shareProject: async (projectId, email, permissions) => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        try {
          // Get user by email
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

          if (userError) throw userError;

          // Create share in Supabase
          const { error: shareError } = await supabase
            .from('project_shares')
            .insert({
              project_id: projectId,
              user_id: userData.id,
              shared_by_id: currentUser.id,
              can_edit: permissions.canEdit,
              can_share: permissions.canShare
            });

          if (shareError) throw shareError;

          // Update local state
          const share: ProjectShare = {
            email,
            sharedBy: {
              id: currentUser.id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              email: currentUser.email
            },
            sharedAt: new Date(),
            permissions
          };

          set(state => ({
            projects: state.projects.map(project =>
              project.id === projectId
                ? {
                    ...project,
                    sharedWith: [...(project.sharedWith || []), share],
                    updatedAt: new Date()
                  }
                : project
            )
          }));
        } catch (error) {
          console.error('Error sharing project:', error);
          throw error;
        }
      },

      deleteProject: async (id) => {
        try {
          // First, delete all project shares to ensure other users can't see it
          const { error: sharesError } = await supabase
            .from('project_shares')
            .delete()
            .eq('project_id', id);

          if (sharesError) {
            console.error('Error deleting project shares:', sharesError);
            // Continue with project deletion even if shares deletion fails
          }

          // Then delete the project itself
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            projects: state.projects.filter(project => project.id !== id)
          }));
        } catch (error) {
          console.error('Error deleting project:', error);
          throw error;
        }
      },

      getAccessibleProjects: () => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return [];

        return get().projects.filter(project => {
          // User is owner
          if (project.ownerId === currentUser.id) return true;
          
          // Project is shared with user
          return project.sharedWith?.some(share => share.email === currentUser.email) || false;
        });
      }
    }),
    {
      name: 'projects-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        projects: state.projects
      })
    }
  )
);

export function useProjects() {
  return useProjectStore();
}