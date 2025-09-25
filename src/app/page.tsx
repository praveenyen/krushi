import TodoApp from "../components/TodoApp";
import ThemeSwitch from "../components/ThemeSwitch";
import AuthGuard from "../components/AuthGuard";
import UserProfile from "../components/UserProfile";
import Link from "next/link";

export default function Home() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" aria-hidden="true"></div>

        {/* Header with Theme Switch and User Profile */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <UserProfile />
          <ThemeSwitch />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <div className="flex gap-2">
            <Link className="bg-blue-800 px-4 py-1 rounded text-white font-bold text-sm" href={'/loan'}>Loan</Link>
            <Link className="bg-green-500 px-4 py-1 rounded text-white font-bold text-sm" href={'/money'}>Money</Link>
          </div>
          <TodoApp />
        </div>

        {/* Hidden content for SEO */}
        <div className="sr-only">
          <h1>Krushi - Harness the Power of Daily Effort</h1>
          <p>
            Harness the power of your daily effort with Krushi, the minimalist app designed to help you focus on what truly matters: consistent progress.
            Build sustainable habits, track your daily efforts, and maintain focus on meaningful tasks that drive real progress.
          </p>
          <h2>Key Features</h2>
          <ul>
            <li>Minimalist task management focused on daily effort</li>
            <li>Progress tracking for consistent habit building</li>
            <li>Priority-based task organization</li>
            <li>Clean, distraction-free interface</li>
            <li>Dark and light theme support</li>
            <li>Automatic progress persistence</li>
            <li>Mobile-responsive design</li>
            <li>Focus on what truly matters</li>
          </ul>
        </div>
      </main>
    </AuthGuard>
  );
}
