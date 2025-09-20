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
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-white">
          Progress Overview
        </h3>
        {totalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-white">
              {completionPercentage}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-300 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Count */}
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {totalCount}
          </div>
          <div className="text-xs sm:text-sm text-white/80 font-medium">
            Total
          </div>
        </div>

        {/* Completed Count */}
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-300 mb-1">
            {completedCount}
          </div>
          <div className="text-xs sm:text-sm text-white/80 font-medium">
            Done
          </div>
        </div>

        {/* Remaining Count */}
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-orange-300 mb-1">
            {remainingCount}
          </div>
          <div className="text-xs sm:text-sm text-white/80 font-medium">
            Left
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      {totalCount > 0 && (
        <div className="mt-4 text-center">
          {completionPercentage === 100 ? (
            <p className="text-green-300 font-medium text-sm">
              🎉 All tasks completed!
            </p>
          ) : remainingCount === 1 ? (
            <p className="text-white/90 font-medium text-sm">
              💪 Almost there! One more to go!
            </p>
          ) : remainingCount <= 3 && remainingCount > 1 ? (
            <p className="text-white/90 font-medium text-sm">
              🚀 Only {remainingCount} tasks left!
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TodoStats;