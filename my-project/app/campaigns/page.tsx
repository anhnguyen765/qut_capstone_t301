export default function Campaigns() {
  return (
    <div className="min-h-screen w-screen bg-gray-100">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-10 rounded-b-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-extrabold text-center sm:text-left">
            Campaigns
          </h1>
          <p className="text-lg text-center sm:text-left max-w-2xl mt-4">
            Create, manage, and track your marketing campaigns to reach your
            audience effectively.
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <input
          type="text"
          placeholder="Search campaigns..."
          className="w-full p-4 border border-gray-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-gray-200 text-gray-700"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h2 className="text-2xl font-bold text-gray-800">Past Campaigns</h2>
          <button className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition-colors">
            New Campaign
          </button>
        </div>
      </div>

      {/* Campaign List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="space-y-6">
          {/* Campaign Item 1 */}
          <div className="flex items-start p-6 bg-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <div className="w-30 h-20 bg-gray-500 rounded mr-4"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Campaign 1
              </h2>
              <p className="text-gray-600">
                Details about Campaign 1. This campaign focuses on social media
                outreach.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
              View Details
            </button>
          </div>

          {/* Campaign Item 2 */}
          <div className="flex items-start p-6 bg-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <div className="w-30 h-20 bg-gray-500 rounded mr-4"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Campaign 2
              </h2>
              <p className="text-gray-600">
                Details about Campaign 2. This campaign focuses on email
                marketing strategies.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
              View Details
            </button>
          </div>

          {/* Campaign Item 3 */}
          <div className="flex items-start p-6 bg-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <div className="w-30 h-20 bg-gray-500 rounded mr-4"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Campaign 3
              </h2>
              <p className="text-gray-600">
                Details about Campaign 3. This campaign focuses on direct mail
                campaigns.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
              View Details
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-300 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-700">
        </div>
      </footer>
    </div>
  );
}
