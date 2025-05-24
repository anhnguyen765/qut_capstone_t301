export default function Templates() {
  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-10 rounded-b-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-extrabold text-center sm:text-left">
            Templates
          </h1>
          <p className="text-lg text-center sm:text-left max-w-2xl mt-4 text-indigo-100">
            Browse and manage reusable templates to streamline your marketing campaigns. 
            Create new templates or customize existing ones to fit your needs.
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <input
          type="text"
          placeholder="Search templates..."
          className="w-full p-4 border border-indigo-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h2 className="text-2xl font-bold text-slate-800">Your Templates</h2>
          <button className="px-6 py-2 bg-indigo-700 text-white rounded-lg shadow hover:bg-indigo-800 transition-colors">
            New Template
          </button>
        </div>
      </div>

      {/* Template List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="space-y-6">
          {/* Template Item 1 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-24 h-16 bg-indigo-100 rounded mr-4 flex items-center justify-center">
              <span className="text-indigo-700 text-xl font-bold">A</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 text-indigo-900">
                Announcement Template
              </h2>
              <p className="text-slate-600 text-sm">
                A template for sending out important announcements to your audience.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              Use Template
            </button>
          </div>

          {/* Template Item 2 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-24 h-16 bg-indigo-100 rounded mr-4 flex items-center justify-center">
              <span className="text-indigo-700 text-xl font-bold">N</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 text-indigo-900">
                Newsletter Template
              </h2>
              <p className="text-slate-600 text-sm">
                A reusable newsletter layout for regular updates and news.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              Use Template
            </button>
          </div>

          {/* Template Item 3 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-24 h-16 bg-indigo-100 rounded mr-4 flex items-center justify-center">
              <span className="text-indigo-700 text-xl font-bold">E</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 text-indigo-900">
                Event Invitation Template
              </h2>
              <p className="text-slate-600 text-sm">
                Invite your contacts to events with this customizable invitation template.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              Use Template
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-indigo-900 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-indigo-100">
        </div>
      </footer>
    </div>
  );
}