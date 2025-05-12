"use client";

import { useState } from "react";
import Link from "next/link";

export default function Sidebar() {
  const [isMarketingOpen, setMarketingOpen] = useState(false);
  const [isContactsOpen, setContactsOpen] = useState(false);

  return (
    <aside className="w-64 h-full bg-gray-900 text-white flex flex-col p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-8 text-center border-b border-gray-700 pb-4">
        2bentrods CRM
      </h2>
      <nav className="flex flex-col gap-4">
        {/* Dashboard */}
        <Link
          href="/"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Dashboard
        </Link>

        {/* Marketing Section */}
        <div>
          <button
            onClick={() => setMarketingOpen(!isMarketingOpen)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
          >
            <span>Marketing</span>
            <span className={`transform transition-transform ${isMarketingOpen ? "rotate-90" : ""}`}>
              ▶
            </span>
          </button>
          {isMarketingOpen && (
            <div className="ml-4 mt-2 flex flex-col gap-2">
              <Link
                href="/campaigns"
                className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
              >
                Campaigns
              </Link>
              <Link
                href="/templates"
                className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
              >
                Templates
              </Link>
              <Link
                href="/newsletters"
                className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
              >
                Newsletters
              </Link>
            </div>
          )}
        </div>

        {/* Contacts Section */}
        <div>
          <button
            onClick={() => setContactsOpen(!isContactsOpen)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
          >
            <span>Contacts</span>
            <span className={`transform transition-transform ${isContactsOpen ? "rotate-90" : ""}`}>
              ▶
            </span>
          </button>
          {isContactsOpen && (
            <div className="ml-4 mt-2 flex flex-col gap-2">
              <Link
                href="/contacts/companies"
                className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
              >
                Companies
              </Link>
              <Link
                href="/contacts/private"
                className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
              >
                Private
              </Link>
              <Link
                href="/contacts/groups"
                className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
              >
                Groups
              </Link>
              <Link
                href="/contacts/schools"
                className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
              >
                Schools
              </Link>
            </div>
          )}
        </div>

        {/* Analytics */}
        <Link
          href="/analytics"
          className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 hover:text-blue-400"
        >
          Analytics
        </Link>
      </nav>
    </aside>
  );
}