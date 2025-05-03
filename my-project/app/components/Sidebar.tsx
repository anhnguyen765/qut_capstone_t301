import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 h-full bg-gray-900 text-white flex flex-col p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-8 text-center border-b border-gray-700 pb-4">
        2bentrods CRM
      </h2>
      <nav className="flex flex-col gap-4">
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Login
        </Link>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Home
        </Link>
        <Link
          href="/campaigns"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Campaigns
        </Link>
        <Link
          href="/automation"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Automation
        </Link>
        <Link
          href="/contacts"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Contacts
        </Link>
        <Link
          href="/analytics"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Analytics
        </Link>
        <Link
          href="/workflows"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Workflows
        </Link>
      </nav>
    </aside>
  );
}