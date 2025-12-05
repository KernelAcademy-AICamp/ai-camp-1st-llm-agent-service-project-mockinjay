/**
 * MealEntryCard Usage Examples
 * Demonstrates various use cases for the MealEntryCard component
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MealEntryCard, type MealLog } from './MealEntryCard';

/**
 * Example 1: Basic Non-Interactive Card
 * Simple display of meal information without click handler
 */
export function BasicMealEntryExample() {
  const log: MealLog = {
    date: '2025-11-23',
    meal: '아침',
    foods: ['현미밥', '된장찌개', '배추김치'],
    calories: 450
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Basic Meal Entry</h2>
      <MealEntryCard log={log} language="ko" />
    </div>
  );
}

/**
 * Example 2: Interactive Card with Navigation
 * Card with click handler for navigation to detail page
 */
export function InteractiveMealEntryExample() {
  const navigate = useNavigate();

  const log: MealLog = {
    date: '2025-11-23',
    meal: 'Breakfast',
    foods: ['Brown Rice', 'Miso Soup', 'Kimchi'],
    calories: 450
  };

  const handleClick = useCallback(() => {
    navigate(`/diet-care/meal/${log.date}/${log.meal}`);
  }, [navigate, log.date, log.meal]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Interactive Meal Entry</h2>
      <MealEntryCard log={log} language="en" onClick={handleClick} />
    </div>
  );
}

/**
 * Example 3: Meal History List
 * Multiple meal entries displayed as a list
 */
export function MealHistoryListExample() {
  const [logs] = useState<MealLog[]>([
    {
      date: '2025-11-23',
      meal: '아침',
      foods: ['현미밥', '된장찌개', '배추김치'],
      calories: 450
    },
    {
      date: '2025-11-23',
      meal: '점심',
      foods: ['닭가슴살', '샐러드', '사과'],
      calories: 520
    },
    {
      date: '2025-11-23',
      meal: '저녁',
      foods: ['현미밥', '두부구이', '브로콜리'],
      calories: 480
    }
  ]);

  const handleMealClick = useCallback((log: MealLog) => {
    console.log('Clicked meal:', log);
    // Navigate to detail page or open modal
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Meal History</h2>
      <div className="space-y-4">
        {logs.map((log) => (
          <MealEntryCard
            key={`${log.date}-${log.meal}`}
            log={log}
            language="ko"
            onClick={() => handleMealClick(log)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Date-Grouped Meal Entries
 * Meals grouped by date with section headers
 */
export function DateGroupedMealEntriesExample() {
  const mealsByDate: Record<string, MealLog[]> = {
    '2025-11-23': [
      {
        date: '2025-11-23',
        meal: '아침',
        foods: ['현미밥', '된장찌개', '배추김치'],
        calories: 450
      },
      {
        date: '2025-11-23',
        meal: '점심',
        foods: ['닭가슴살', '샐러드', '사과'],
        calories: 520
      },
      {
        date: '2025-11-23',
        meal: '저녁',
        foods: ['현미밥', '두부구이', '브로콜리'],
        calories: 480
      }
    ],
    '2025-11-22': [
      {
        date: '2025-11-22',
        meal: '아침',
        foods: ['귀리죽', '삶은 계란', '토마토'],
        calories: 380
      },
      {
        date: '2025-11-22',
        meal: '점심',
        foods: ['생선구이', '나물', '현미밥'],
        calories: 550
      }
    ]
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Meal History by Date</h2>
      <div className="space-y-6">
        {Object.entries(mealsByDate).map(([date, meals]) => (
          <div key={date}>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              {date}
            </h3>
            <div className="space-y-3">
              {meals.map((log) => (
                <MealEntryCard
                  key={`${log.date}-${log.meal}`}
                  log={log}
                  language="ko"
                  onClick={() => console.log('Clicked:', log)}
                />
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total: {meals.reduce((sum, log) => sum + log.calories, 0)} kcal
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 5: Filtered Meal Entries
 * Filter meals by type with interactive cards
 */
export function FilteredMealEntriesExample() {
  const [selectedMealType, setSelectedMealType] = useState<string>('all');

  const allLogs: MealLog[] = [
    {
      date: '2025-11-23',
      meal: '아침',
      foods: ['현미밥', '된장찌개', '배추김치'],
      calories: 450
    },
    {
      date: '2025-11-23',
      meal: '점심',
      foods: ['닭가슴살', '샐러드', '사과'],
      calories: 520
    },
    {
      date: '2025-11-22',
      meal: '아침',
      foods: ['귀리죽', '삶은 계란', '토마토'],
      calories: 380
    }
  ];

  const filteredLogs = selectedMealType === 'all'
    ? allLogs
    : allLogs.filter(log => log.meal === selectedMealType);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Filtered Meal History</h2>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {['all', '아침', '점심', '저녁'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedMealType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedMealType === type
                ? 'bg-[#00C9B7] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {type === 'all' ? '전체' : type}
          </button>
        ))}
      </div>

      {/* Meal Cards */}
      <div className="space-y-4">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <MealEntryCard
              key={`${log.date}-${log.meal}`}
              log={log}
              language="ko"
            />
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            선택한 식사 유형의 기록이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Example 6: Editable Meal Entry with Modal
 * Click to open edit modal
 */
export function EditableMealEntryExample() {
  const [selectedLog, setSelectedLog] = useState<MealLog | null>(null);

  const logs: MealLog[] = [
    {
      date: '2025-11-23',
      meal: '아침',
      foods: ['현미밥', '된장찌개', '배추김치'],
      calories: 450
    },
    {
      date: '2025-11-23',
      meal: '점심',
      foods: ['닭가슴살', '샐러드', '사과'],
      calories: 520
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Editable Meal Entries</h2>
      <div className="space-y-4">
        {logs.map((log) => (
          <MealEntryCard
            key={`${log.date}-${log.meal}`}
            log={log}
            language="ko"
            onClick={() => setSelectedLog(log)}
          />
        ))}
      </div>

      {/* Simple Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedLog.meal} - {selectedLog.date}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Foods
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedLog.foods.map((food, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Calories
                </label>
                <p className="text-2xl font-bold text-[#00C9B7]">
                  {selectedLog.calories} kcal
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full bg-[#00C9B7] text-white py-2 rounded-lg font-medium hover:bg-[#00B3A0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 7: Complete DietCare Page Implementation
 * Full implementation matching the reference design
 */
export function DietCarePageExample() {
  const navigate = useNavigate();

  const dietLogs: MealLog[] = [
    {
      date: '2025-11-23',
      meal: '아침',
      foods: ['현미밥', '된장찌개', '배추김치'],
      calories: 450
    },
    {
      date: '2025-11-23',
      meal: '점심',
      foods: ['닭가슴살', '샐러드', '사과'],
      calories: 520
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#1F2937] dark:text-white">
          식사 기록
        </h3>
        <button
          className="px-4 py-2 rounded-xl text-white font-medium"
          style={{ background: 'linear-gradient(135deg, rgb(0, 200, 180) 0%, rgb(159, 122, 234) 100%)' }}
        >
          식사 추가
        </button>
      </div>

      <div className="space-y-4">
        {dietLogs.map((log) => (
          <MealEntryCard
            key={`${log.date}-${log.meal}`}
            log={log}
            language="ko"
            onClick={() => navigate(`/diet-care/meal/${log.date}/${log.meal}`)}
          />
        ))}
      </div>
    </div>
  );
}
