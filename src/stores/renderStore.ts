import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RenderMainCategory, RenderItem, RenderSubCategoryType } from '../components/budget/render/RenderTable';

interface RenderStore {
  categories: RenderMainCategory[];
  isCompleted: boolean;
  setIsCompleted: (completed: boolean) => void;
  addItem: (categoryType: string, subCategoryType: RenderSubCategoryType, item: RenderItem) => void;
  updateItem: (categoryType: string, subCategoryType: RenderSubCategoryType, itemId: string, updates: Partial<RenderItem>) => void;
  deleteItem: (categoryType: string, subCategoryType: RenderSubCategoryType, itemId: string) => void;
  reset: () => void;
}

const initialCategories: RenderMainCategory[] = [
  {
    type: 'production',
    subCategories: [
      { type: 'salaries', items: [] },
      { type: 'suppliers', items: [] },
      { type: 'expenses', items: [] }
    ]
  },
  {
    type: 'postproduction',
    subCategories: [
      { type: 'salaries', items: [] },
      { type: 'suppliers', items: [] },
      { type: 'expenses', items: [] }
    ]
  }
];

export const useRenderStore = create<RenderStore>()(
  persist(
    (set) => ({
      categories: initialCategories,
      isCompleted: false,

      setIsCompleted: (completed) => set({ isCompleted: completed }),

      addItem: (categoryType, subCategoryType, item) => set((state) => {
        console.log("Ajout d'un élément dans le store:", categoryType, subCategoryType, item);
        
        return {
          categories: state.categories.map(category => {
            if (category.type !== categoryType) return category;

            const existingSubCategory = category.subCategories.find(sc => sc.type === subCategoryType);
            if (existingSubCategory) {
              // Vérifier si l'élément existe déjà
              const existingItemIndex = existingSubCategory.items.findIndex(i => i.id === item.id);
              
              if (existingItemIndex >= 0) {
                // Mettre à jour l'élément existant
                return {
                  ...category,
                  subCategories: category.subCategories.map(sc =>
                    sc.type === subCategoryType
                      ? { 
                          ...sc, 
                          items: sc.items.map((i, index) => 
                            index === existingItemIndex ? item : i
                          )
                        }
                      : sc
                  )
                };
              }
              
              // Ajouter un nouvel élément
              return {
                ...category,
                subCategories: category.subCategories.map(sc =>
                  sc.type === subCategoryType
                    ? { ...sc, items: [...sc.items, item] }
                    : sc
                )
              };
            } else {
              return {
                ...category,
                subCategories: [...category.subCategories, { type: subCategoryType, items: [item] }]
              };
            }
          })
        };
      }),

      updateItem: (categoryType, subCategoryType, itemId, updates) => set((state) => {
        console.log("Mise à jour d'un élément dans le store:", categoryType, subCategoryType, itemId, updates);
        
        return {
          categories: state.categories.map(category => {
            if (category.type !== categoryType) return category;

            return {
              ...category,
              subCategories: category.subCategories.map(sc => {
                if (sc.type !== subCategoryType) return sc;

                return {
                  ...sc,
                  items: sc.items.map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                  )
                };
              })
            };
          })
        };
      }),

      // Nouvelle fonction pour remplacer complètement un élément
      replaceItem: (categoryType, subCategoryType, item) => set((state) => ({
        categories: state.categories.map(category => {
          if (category.type !== categoryType) return category;

          return {
            ...category,
            subCategories: category.subCategories.map(sc => {
              if (sc.type !== subCategoryType) return sc;

              // Vérifier si l'élément existe déjà
              const existingIndex = sc.items.findIndex(i => i.id === item.id);
              
              if (existingIndex >= 0) {
                // Remplacer l'élément existant
                return {
                  ...sc,
                  items: sc.items.map((i, index) => 
                    index === existingIndex ? item : i
                  )
                };
              } else {
                // Ajouter un nouvel élément
                return {
                  ...sc,
                  items: [...sc.items, item]
                };
              }
            })
          };
        })
      })),

      deleteItem: (categoryType, subCategoryType, itemId) => set((state) => ({
        categories: state.categories.map(category => {
          if (category.type !== categoryType) return category;

          return {
            ...category,
            subCategories: category.subCategories.map(sc => {
              if (sc.type !== subCategoryType) return sc;

              return {
                ...sc,
                items: sc.items.filter(item => item.id !== itemId)
              };
            })
          };
        })
      })),

      reset: () => set({ categories: initialCategories, isCompleted: false })
    }),
    {
      name: 'render-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          return {
            ...persistedState,
            categories: initialCategories,
            isCompleted: false
          };
        }
        return persistedState;
      }
    }
  )
);