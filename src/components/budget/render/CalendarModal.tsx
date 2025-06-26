import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarModalProps {
  selectedDates: string[];
  onSave: (dates: string[]) => void;
  onClose: () => void;
}

export function CalendarModal({ selectedDates, onSave, onClose }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDatesState, setSelectedDatesState] = useState<string[]>(selectedDates);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    if (selectedDatesState.includes(dateString)) {
      setSelectedDatesState(selectedDatesState.filter(d => d !== dateString));
    } else {
      setSelectedDatesState([...selectedDatesState, dateString]);
    }
  };

  const handleSave = () => {
    onSave(selectedDatesState);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Jours travaillés</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <h4 className="text-base font-medium text-gray-900">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h4>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight size={20} className="text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOfMonth(currentMonth).getDay() === 0 ? 6 : startOfMonth(currentMonth).getDay() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10"></div>
            ))}
            
            {daysInMonth.map((day) => {
              const dateString = day.toISOString().split('T')[0];
              const isSelected = selectedDatesState.includes(dateString);
              
              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDateClick(day)}
                  className={`h-10 flex items-center justify-center rounded-full text-sm ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedDatesState.length} jour{selectedDatesState.length > 1 ? 's' : ''} sélectionné{selectedDatesState.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setSelectedDatesState([])}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Effacer la sélection
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            <Check size={16} />
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}