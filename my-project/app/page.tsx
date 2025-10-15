import DashboardCalendar from "./components/DashboardCalendar";
import Performance from "./components/Performance";
import DashboardOverview from "./components/DashboardOverview";
import RecentCampaigns from "./components/RecentCampaigns";
import SubscriberTrend from "./components/SubscriberTrend";
import SmtpHealth from "./components/SmtpHealth";

export default function Dashboard() {
  return (
    <main className="py-8" aria-labelledby="dashboard-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 id="dashboard-heading" className="text-3xl font-semibold mb-2">
            Dashboard
          </h1>
        </div>

        {/* Responsive grid: main (2/3) and sidebar (1/3) on md+ */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main column: spans 2 on md+ */}
          <section className="md:col-span-2 space-y-6" aria-labelledby="main-heading">
            <h2 id="main-heading" className="sr-only">
              Main dashboard content
            </h2>

            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg p-6">
              <DashboardOverview />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="min-h-0">
                <h3 className="text-lg font-medium mb-4">Performance</h3>
                <Performance />
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6" aria-labelledby="sidebar-heading">
            <h2 id="sidebar-heading" className="sr-only">
              Sidebar widgets
            </h2>

            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Recent Campaigns</h3>
              <RecentCampaigns />
            </div>


            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">SMTP Health</h3>
              <SmtpHealth />
            </div>
          </aside>
        </div>
      </div>
      {/* Full-width calendar section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg p-6">
            <DashboardCalendar height={520} />
          </div>
        </section>
      </div>
    </main>
  );
}