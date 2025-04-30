import Image from "next/image";

export default function Dashboard() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center w-full">
          <div>
            <h1 className="text-4xl font-bold text-center sm:text-left">
              Welcome to 2bentrods CRM Dashboard
            </h1>
            <p className="text-lg text-center sm:text-left text-gray-600 max-w-2xl">
              Manage your campaigns, automation, contacts, analytics, and workflows all in one place.
            </p>
          </div>
          <Image
            src="/favicon.ico"
            alt="2bentrods CRM Logo"
            width={150}
            height={40}
            priority
          />
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <a
            href="/campaigns"
            className="p-6 bg-blue-100 rounded-lg shadow hover:bg-blue-200 transition"
          >
            <h2 className="text-xl font-bold">Campaigns</h2>
            <p className="text-gray-600">Create and manage your marketing campaigns.</p>
          </a>
          <a
            href="/automation"
            className="p-6 bg-green-100 rounded-lg shadow hover:bg-green-200 transition"
          >
            <h2 className="text-xl font-bold">Automation</h2>
            <p className="text-gray-600">Automate repetitive tasks and workflows.</p>
          </a>
          <a
            href="/contacts"
            className="p-6 bg-yellow-100 rounded-lg shadow hover:bg-yellow-200 transition"
          >
            <h2 className="text-xl font-bold">Contacts</h2>
            <p className="text-gray-600">Manage your customer and client contacts.</p>
          </a>
          <a
            href="/analytics"
            className="p-6 bg-purple-100 rounded-lg shadow hover:bg-purple-200 transition"
          >
            <h2 className="text-xl font-bold">Analytics</h2>
            <p className="text-gray-600">Track and analyze your business performance.</p>
          </a>
          <a
            href="/workflows"
            className="p-6 bg-red-100 rounded-lg shadow hover:bg-red-200 transition"
          >
            <h2 className="text-xl font-bold">Workflows</h2>
            <p className="text-gray-600">Design and manage your workflows.</p>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://2bentrods.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://2bentrods.com/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </a>
      </footer>
    </div>
  );
}