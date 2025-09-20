import { TodoStatsProps } from '../types/todo';

/**
 * TodoStats component displays statistics about the todo list
 * including total, completed, and remaining counts
 */
export const TodoStats: React.FC<TodoStatsProps> = ({ todos }) => {
  // Calculate statistics
  const totalCount = todos.length;
  const completedCount = todos.filter(todo => todo.completed).length;
  const remainingCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
          Progress Overview
        </h3>
        {totalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-700 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {completionPercentage}% Complete
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Count */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalCount}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Tasks
              </div>
            </div>
          </div>
        </div>

        {/* Completed Count */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                {completedCount}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completed
              </div>
            </div>
          </div>
        </div>

        {/* Remaining Count */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                {remainingCount}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Remaining
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      {totalCount > 0 && (
        <div className="mt-6 text-center">
          {completionPercentage === 100 ? (
            <p className="text-green-700 dark:text-green-400 font-medium">
              🎉 Congratulations! All tasks completed!
            </p>
          ) : remainingCount === 1 ? (
            <p className="text-blue-700 dark:text-blue-400 font-medium">
              💪 Almost there! Just one more task to go!
            </p>
          ) : remainingCount <= 3 && remainingCount > 1 ? (
            <p className="text-blue-700 dark:text-blue-400 font-medium">
              🚀 You&apos;re doing great! Only {remainingCount} tasks left!
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TodoStats;