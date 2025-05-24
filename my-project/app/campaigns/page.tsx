export default function Campaigns() {
  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-10 rounded-b-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-extrabold text-center sm:text-left">
            Campaigns
          </h1>
          <p className="text-lg text-center sm:text-left max-w-2xl mt-4 text-indigo-100">
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
          className="w-full p-4 border border-indigo-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h2 className="text-2xl font-bold text-slate-800">Past Campaigns</h2>
          <button className="px-6 py-2 bg-indigo-700 text-white rounded-lg shadow hover:bg-indigo-800 transition-colors">
            New Campaign
          </button>
        </div>
      </div>

      {/* Campaign List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="space-y-6">
          {/* Campaign Item 1 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-30 h-20 bg-indigo-200 rounded mr-4"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-indigo-900">
                Campaign 1
              </h2>
              <p className="text-slate-600">
                Details about Campaign 1. This campaign focuses on social media
                outreach.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              View Details
            </button>
          </div>

          {/* Campaign Item 2 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-30 h-20 bg-indigo-200 rounded mr-4"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-indigo-900">
                Campaign 2
              </h2>
              <p className="text-slate-600">
                Details about Campaign 2. This campaign focuses on email
                marketing strategies.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              View Details
            </button>
          </div>

          {/* Campaign Item 3 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-30 h-20 bg-indigo-200 rounded mr-4"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-indigo-900">
                Campaign 3
              </h2>
              <p className="text-slate-600">
                Details about Campaign 3. This campaign focuses on direct mail
                campaigns.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              View Details
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-indigo-900 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-indigo-100">
          &copy; {new Date().getFullYear()} Two Bent Rods. All rights reserved.
        </div>
      </footer>
    </div>
  );
}