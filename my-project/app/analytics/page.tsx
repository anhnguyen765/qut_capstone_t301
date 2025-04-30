export default function Analytics() {
    return (
      <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-center sm:text-left">
            Analytics
          </h1>
          <p className="text-lg text-center sm:text-left text-gray-600 max-w-2xl">
            Gain insights into your business performance with detailed analytics and reports.
          </p>
        </header>
  
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for analytics cards */}
          <div className="p-6 bg-blue-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Sales Overview</h2>
            <p className="text-gray-600">Track your sales performance over time.</p>
          </div>
          <div className="p-6 bg-green-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Customer Insights</h2>
            <p className="text-gray-600">Understand your customer demographics and behavior.</p>
          </div>
          <div className="p-6 bg-yellow-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Campaign Performance</h2>
            <p className="text-gray-600">Analyze the effectiveness of your marketing campaigns.</p>
          </div>
        </section>
      </div>
    );
  }