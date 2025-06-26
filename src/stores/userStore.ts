import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types/user';
import { createClient } from '@supabase/supabase-js';
import { cleanupAuthUsers } from '../utils/cleanupAuth';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface UserState {
  currentUser: User | null;
  users: User[];
  createUser: (data: { 
    email: string;
    password: string;
    firstName: string; 
    lastName: string;
    phoneNumber: string;
    role: UserRole;
    productionName?: string;
    productionAddress?: string;
    productionLogo?: string;
    productionTerms?: string;
  }) => Promise<User | { error: string }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  loadUserData: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],

      createUser: async (data) => {
        try {
          // 1. Clean up existing data
          await cleanupAuthUsers();

          // 2. Sign up new user
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: data.email.toLowerCase(),
            password: data.password,
            options: {
              data: {
                first_name: data.firstName,
                last_name: data.lastName,
                role: data.role
              }
            }
          });

          if (signUpError) throw signUpError;
          if (!authData.user) throw new Error('No user returned from auth');

          // 3. Create user in database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: data.email.toLowerCase(),
              first_name: data.firstName,
              last_name: data.lastName,
              phone_number: data.phoneNumber,
              role: data.role
            })
            .select()
            .single();

          if (userError) throw userError;

          // 4. Create production if needed
          let productionData = null;
          let productionTermsData = null;
          if (data.role === 'production' && data.productionName) {
            // Check if production already exists for this user
            const { data: existingProductions, error: checkError } = await supabase
              .from('productions')
              .select('id')
              .eq('user_id', authData.user.id)
              .order('created_at', { ascending: false });
              
            if (checkError) {
              console.error('Error checking existing productions:', checkError);
              // Continue despite error
            }
            
            // If multiple productions exist, use the most recent one
            if (existingProductions && existingProductions.length > 0) {
              console.log(`Found ${existingProductions.length} existing productions, using the most recent one`);
              const productionId = existingProductions[0].id;
              
              // Update existing production
              const { data: production, error: updateError } = await supabase
                .from('productions')
                .update({
                  name: data.productionName,
                  address: data.productionAddress,
                  logo_url: data.productionLogo
                })
                .eq('id', productionId)
                .select()
                .single();
                
              if (updateError) throw updateError;
              productionData = production;
              
              // Handle terms
              if (data.productionTerms) {
                // Check for existing terms
                const { data: existingTerms, error: termsCheckError } = await supabase
                  .from('production_terms')
                  .select('id')
                  .eq('production_id', productionId)
                  .limit(1);
                  
                if (termsCheckError) {
                  console.error('Error checking existing terms:', termsCheckError);
                }
                
                if (existingTerms && existingTerms.length > 0) {
                  // Update existing terms
                  const { data: terms, error: termsUpdateError } = await supabase
                    .from('production_terms')
                    .update({ terms_and_conditions: data.productionTerms })
                    .eq('id', existingTerms[0].id)
                    .select()
                    .single();
                    
                  if (termsUpdateError) {
                    console.error('Error updating terms:', termsUpdateError);
                  } else {
                    productionTermsData = terms;
                  }
                } else {
                  // Create new terms
                  const { data: terms, error: termsInsertError } = await supabase
                    .from('production_terms')
                    .insert({
                      production_id: productionId,
                      terms_and_conditions: data.productionTerms
                    })
                    .select()
                    .single();
                    
                  if (termsInsertError) {
                    console.error('Error creating terms:', termsInsertError);
                  } else {
                    productionTermsData = terms;
                  }
                }
              }
            } else {
              // Create new production
              const { data: production, error: productionError } = await supabase
                .from('productions')
                .insert({
                  user_id: authData.user.id,
                  name: data.productionName,
                  address: data.productionAddress,
                  logo_url: data.productionLogo
                })
                .select()
                .single();

              if (productionError) throw productionError;
              productionData = production;
              
              // Create production terms if provided
              if (data.productionTerms) {
                const { data: terms, error: termsError } = await supabase
                  .from('production_terms')
                  .insert({
                    production_id: production.id,
                    terms_and_conditions: data.productionTerms
                  })
                  .select()
                  .single();
                  
                if (termsError) {
                  console.error('Error creating production terms:', termsError);
                  // Continue even if terms creation fails
                } else {
                  productionTermsData = terms;
                }
              }
            }
          }

          // 5. Create user object
          const newUser: User = {
            id: authData.user.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            role: data.role,
            productionName: productionData?.name,
            productionAddress: productionData?.address,
            productionLogo: productionData?.logo_url,
            productionTerms: productionTermsData?.terms_and_conditions,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // 6. Update local state
          set(state => ({
            users: [...state.users, newUser],
            currentUser: newUser
          }));

          return newUser;
        } catch (error) {
          console.error('Error creating user:', error);
          if (error instanceof Error) {
            return { error: error.message };
          }
          return { error: "Erreur lors de la création du compte" };
        }
      },

      loginUser: async (email, password) => {
        try {
          // 1. Sign in with Supabase auth
          const { data: { user: authUser }, error: authError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password
          });

          if (authError) {
            return {
              success: false,
              error: authError.message === 'Invalid login credentials'
                ? "Email ou mot de passe incorrect"
                : "Erreur lors de la connexion"
            };
          }

          if (!authUser) {
            return {
              success: false,
              error: "Erreur d'authentification"
            };
          }

          // 2. Get user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (userError || !userData) {
            console.error('Error fetching user data:', userError);
            return {
              success: false,
              error: "Erreur lors de la récupération des données utilisateur"
            };
          }

          // 3. Get production data if user is a production
          let productionData = null;
          let productionTermsData = null;
          if (userData.role === 'production') {
            const { data: production, error: productionError } = await supabase
              .from('productions')
              .select('*')
              .eq('user_id', userData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (productionError) {
              console.error('Error fetching production data:', productionError);
            } else if (production) {
              productionData = production;

              // Get production terms
              const { data: terms, error: termsError } = await supabase
                .from('production_terms')
                .select('*')
                .eq('production_id', production.id)
                .limit(1)
                .single();

              if (termsError) {
                console.error('Error fetching production terms:', termsError);
              } else {
                productionTermsData = terms;
              }
            }
          }

          // 4. Create user object
          const user: User = {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            phoneNumber: userData.phone_number,
            role: userData.role,
            productionName: productionData?.name,
            productionAddress: productionData?.address,
            productionLogo: productionData?.logo_url,
            productionTerms: productionTermsData?.terms_and_conditions,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at)
          };

          // 5. Update state
          set({ currentUser: user });
          return { success: true };
        } catch (error) {
          console.error('Error during login:', error);
          return {
            success: false,
            error: "Une erreur inattendue s'est produite"
          };
        }
      },

      updateUser: async (updates) => {
        const currentUser = get().currentUser;
        if (!currentUser) throw new Error('No user logged in');

        try {
          // 1. Update user data
          const { error: userError } = await supabase
            .from('users')
            .update({
              first_name: updates.firstName,
              last_name: updates.lastName,
              phone_number: updates.phoneNumber,
              role: updates.role
            })
            .eq('id', currentUser.id);

          if (userError) throw userError;

          // 2. Update production data if applicable
          if (currentUser.role === 'production') {
            // Check if production already exists for this user
            const { data: existingProductions, error: productionQueryError } = await supabase
              .from('productions')
              .select('id')
              .eq('user_id', currentUser.id)
              .order('created_at', { ascending: false });
              
            if (productionQueryError) {
              console.error('Error checking existing productions:', productionQueryError);
              throw productionQueryError;
            }
            
            // If multiple productions exist, use the most recent one
            if (existingProductions && existingProductions.length > 0) {
              console.log(`Found ${existingProductions.length} existing productions, using the most recent one`);
              const productionId = existingProductions[0].id;
              
              // Update existing production
              const { error: productionUpdateError } = await supabase
                .from('productions')
                .update({
                  name: updates.productionName,
                  address: updates.productionAddress,
                  logo_url: updates.productionLogo
                })
                .eq('id', productionId);
                
              if (productionUpdateError) throw productionUpdateError;
              
              // Update production terms if provided
              if (updates.productionTerms !== undefined) {
                // Check if terms already exist
                const { data: existingTerms, error: termsQueryError } = await supabase
                  .from('production_terms')
                  .select('id')
                  .eq('production_id', productionId)
                  .limit(1);
                  
                if (termsQueryError) {
                  console.error('Error checking existing terms:', termsQueryError);
                  // Continue even if query fails
                }
                  
                if (existingTerms && existingTerms.length > 0) {
                  // Update existing terms
                  const { error: termsUpdateError } = await supabase
                    .from('production_terms')
                    .update({ terms_and_conditions: updates.productionTerms })
                    .eq('id', existingTerms[0].id);
                    
                  if (termsUpdateError) {
                    console.error('Error updating production terms:', termsUpdateError);
                    // Continue even if update fails
                  }
                } else {
                  // Create new terms
                  const { error: termsInsertError } = await supabase
                    .from('production_terms')
                    .insert({
                      production_id: productionId,
                      terms_and_conditions: updates.productionTerms
                    });
                    
                  if (termsInsertError) {
                    console.error('Error creating production terms:', termsInsertError);
                    // Continue even if insert fails
                  }
                }
              }
            } else {
              // Create new production
              const { data: newProduction, error: productionInsertError } = await supabase
                .from('productions')
                .insert({
                  user_id: currentUser.id,
                  name: updates.productionName,
                  address: updates.productionAddress,
                  logo_url: updates.productionLogo
                })
                .select()
                .single();
                
              if (productionInsertError) throw productionInsertError;
              
              // Create production terms if provided
              if (updates.productionTerms) {
                const { error: termsInsertError } = await supabase
                  .from('production_terms')
                  .insert({
                    production_id: newProduction.id,
                    terms_and_conditions: updates.productionTerms
                  });
                  
                if (termsInsertError) {
                  console.error('Error creating production terms:', termsInsertError);
                  // Continue even if insert fails
                }
              }
            }
          }

          // 3. Update local state
          const updatedUser = { 
            ...currentUser, 
            ...updates,
            updatedAt: new Date()
          };

          set(state => ({
            currentUser: updatedUser,
            users: state.users.map(u => 
              u.id === updatedUser.id ? updatedUser : u
            )
          }));
        } catch (error) {
          console.error('Error updating user:', error);
          throw error;
        }
      },

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },
      
      loadUserData: async () => {
        try {
          // Check if user is authenticated
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.log('No active session found');
            return;
          }
          
          // Get current user
          const { data: authUser, error: authError } = await supabase.auth.getUser();
          
          if (authError || !authUser.user) {
            console.error('Error getting authenticated user:', authError);
            return;
          }
          
          // Get user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.user.id)
            .single();

          if (userError || !userData) {
            console.error('Error fetching user data:', userError);
            return;
          }

          // Get production data if user is a production
          let productionData = null;
          let productionTermsData = null;
          if (userData.role === 'production') {
            const { data: production, error: productionError } = await supabase
              .from('productions')
              .select('*')
              .eq('user_id', userData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (productionError) {
              console.error('Error fetching production data:', productionError);
            } else if (production) {
              productionData = production;

              // Get production terms
              const { data: terms, error: termsError } = await supabase
                .from('production_terms')
                .select('*')
                .eq('production_id', production.id)
                .limit(1)
                .single();

              if (termsError) {
                console.error('Error fetching production terms:', termsError);
              } else {
                productionTermsData = terms;
              }
            }
          }

          // Create user object
          const user: User = {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            phoneNumber: userData.phone_number,
            role: userData.role,
            productionName: productionData?.name,
            productionAddress: productionData?.address,
            productionLogo: productionData?.logo_url,
            productionTerms: productionTermsData?.terms_and_conditions,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at)
          };

          // Update state
          set({ currentUser: user });
          console.log('User data loaded successfully');
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    }),
    {
      name: 'user-storage',
      storage: localStorage,
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users
      })
    }
  )
);