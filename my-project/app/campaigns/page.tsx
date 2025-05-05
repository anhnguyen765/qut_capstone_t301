export default function Campaigns() {
    return (
      <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-center sm:text-left text-[var(--foreground)]">
            Campaigns
          </h1>
          <p className="text-lg text-center sm:text-left text-[var(--muted-foreground)] max-w-2xl">
            Create, manage, and track your marketing campaigns to reach your audience effectively.
          </p>
        </header>
  
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for campaign cards */}
          <div className="p-6 bg-blue-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Campaign 1</h2>
            <p className="text-gray-600">Details about Campaign 1.</p>
          </div>
          <div className="p-6 bg-green-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Campaign 2</h2>
            <p className="text-gray-600">Details about Campaign 2.</p>
          </div>
          <div className="p-6 bg-yellow-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Campaign 3</h2>
            <p className="text-gray-600">Details about Campaign 3.</p>
          </div>
        </section>
      </div>
    );
  }