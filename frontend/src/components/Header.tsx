export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-xl font-bold">Trading Platform</h1>
          <nav className="space-x-4">
            <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Home
            </a>
            <a href="/portfolio" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Portfolio
            </a>
            <a href="/market" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Market
            </a>
            <a href="/trading" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Trading
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
