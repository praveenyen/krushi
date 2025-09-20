import TodoApp from "../components/TodoApp";
import ThemeSwitch from "../components/ThemeSwitch";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
      
      {/* Theme Switch */}
      <ThemeSwitch />
      
      {/* Main Content */}
      <div className="relative z-10">
        <TodoApp />
      </div>
    </div>
  );
}
