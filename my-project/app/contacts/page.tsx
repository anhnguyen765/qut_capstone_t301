export default function Contacts() {
    return (
      <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-center sm:text-left">
            Contacts
          </h1>
          <p className="text-lg text-center sm:text-left text-gray-600 max-w-2xl">
            Manage your customer and client contacts efficiently. Add, edit, and organize your contacts in one place.
          </p>
        </header>
  
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for contact cards */}
          <div className="p-6 bg-blue-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">John Doe</h2>
            <p className="text-gray-600">john.doe@example.com</p>
            <p className="text-gray-600">+1 234 567 890</p>
          </div>
          <div className="p-6 bg-green-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Jane Smith</h2>
            <p className="text-gray-600">jane.smith@example.com</p>
            <p className="text-gray-600">+1 987 654 321</p>
          </div>
          <div className="p-6 bg-yellow-100 rounded-lg shadow">
            <h2 className="text-xl font-bold">Alice Johnson</h2>
            <p className="text-gray-600">alice.johnson@example.com</p>
            <p className="text-gray-600">+1 555 123 456</p>
          </div>
        </section>
      </div>
    );
  }