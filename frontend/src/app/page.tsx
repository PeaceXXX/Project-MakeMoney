export default function Home() {
  return (
    <main className="min-h-screen p-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Trading Platform
        </h1>
        <p className="text-xl mb-8">
          Welcome to the Trading and Finance Platform
        </p>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-2">Portfolio</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your investment portfolio
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-2">Market Data</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time stock prices and charts
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-2">Trading</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Execute trades and manage orders
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
