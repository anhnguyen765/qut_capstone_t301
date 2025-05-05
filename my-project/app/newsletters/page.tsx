export default function Newsletters() {
    return (
      <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-center sm:text-left">
            Newsletters
          </h1>
          <p className="text-lg text-center sm:text-left text-gray-600 max-w-2xl">
            Design, manage, and optimize your newsletters to improve productivity and streamline operations.
          </p>
        </header>
  
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for newsletter cards */}
          <div className="p-6 bg-blue-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Newsletter 1</h2>
            <p className="text-gray-600">Details about newsletter 1.</p>
          </div>
          <div className="p-6 bg-green-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Newsletter 2</h2>
            <p className="text-gray-600">Details about newsletter 2.</p>
          </div>
          <div className="p-6 bg-yellow-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Newsletter 3</h2>
            <p className="text-gray-600">Details about newsletter 3.</p>
          </div>
        </section>
      </div>
    );
  }