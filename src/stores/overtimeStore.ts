import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OvertimeData } from '../types/overtime';
import { calculateOvertimeRates, calculateOvertimeTotal, formatOvertimeDetails } from '../utils/overtime/calculations';

interface OvertimeStore {
  overtimeData: Record<string, OvertimeData>;
  getOvertimeData: (lineId: string, dailyRate: number) => OvertimeData;
  saveOvertimeData: (lineId: string, data: OvertimeData) => void;
  clearOvertimeData: (lineId: string) => void;
}

export const useOvertimeStore = create<OvertimeStore>()(
  persist(
    (set, get) => ({
      overtimeData: {},
      
      getOvertimeData: (lineId, dailyRate) => {
        const data = get().overtimeData[lineId];
        if (data) return data;

        return {
          baseHours: 8,
          normalHours: 0,
          x1_5Hours: 0,
          x2Hours: 0,
          rates: calculateOvertimeRates(dailyRate)
        };
      },
      
      saveOvertimeData: (lineId, data) => {
        const total = calculateOvertimeTotal(data);
        const details = formatOvertimeDetails(data);
        
        set((state) => ({
          overtimeData: {
            ...state.overtimeData,
            [lineId]: {
              ...data,
              total,
              details
            }
          }
        }));
      },
      
      clearOvertimeData: (lineId) => {
        set((state) => {
          const { [lineId]: _, ...rest } = state.overtimeData;
          return { overtimeData: rest };
        });
      }
    }),
    {
      name: 'overtime-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          return {
            overtimeData: {}
          };
        }
        return persistedState;
      }
    }
  )
);