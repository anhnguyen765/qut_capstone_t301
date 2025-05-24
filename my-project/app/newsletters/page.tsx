export default function Newsletters() {
  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-10 rounded-b-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-extrabold text-center sm:text-left">
            Newsletters
          </h1>
          <p className="text-lg text-center sm:text-left max-w-2xl mt-4 text-blue-100">
            Design, manage, and optimize your newsletters to engage your audience and streamline communication.
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <input
          type="text"
          placeholder="Search newsletters..."
          className="w-full p-4 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h2 className="text-2xl font-bold text-slate-800">Your Newsletters</h2>
          <button className="px-6 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 transition-colors">
            New Newsletter
          </button>
        </div>
      </div>

      {/* Newsletter List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="space-y-6">
          {/* Newsletter Item 1 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-24 h-16 bg-blue-100 rounded mr-4 flex items-center justify-center">
              <span className="text-blue-700 text-xl font-bold">N1</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 text-blue-900">
                Monthly Update
              </h2>
              <p className="text-slate-600 text-sm">
                Keep your subscribers informed with the latest news and updates.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              View Newsletter
            </button>
          </div>

          {/* Newsletter Item 2 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-24 h-16 bg-green-100 rounded mr-4 flex items-center justify-center">
              <span className="text-green-700 text-xl font-bold">N2</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 text-green-900">
                Special Announcement
              </h2>
              <p className="text-slate-600 text-sm">
                Share important announcements and special offers with your audience.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              View Newsletter
            </button>
          </div>

          {/* Newsletter Item 3 */}
          <div className="flex items-start p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-slate-200">
            <div className="w-24 h-16 bg-yellow-100 rounded mr-4 flex items-center justify-center">
              <span className="text-yellow-700 text-xl font-bold">N3</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 text-yellow-900">
                Event Invitation
              </h2>
              <p className="text-slate-600 text-sm">
                Invite your subscribers to upcoming events and activities.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors">
              View Newsletter
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-blue-100">
          &copy; {new Date().getFullYear()} Two Bent Rods. All rights reserved.
        </div>
      </footer>
    </div>
  );
}