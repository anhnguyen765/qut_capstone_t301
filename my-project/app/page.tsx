import DashboardCalendar from "./components/DashboardCalendar";
import Performance from "./components/Performance";

export default function Dashboard() {
  return (
    <div className="py-8 px-[10%]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Dashboard
        </h1>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <section className="lg:w-1/3">
          <h2 className="text-2xl sm:text-xl font-bold text-foreground mb-4">Performance</h2>
          <Performance />
        </section>
        <div className="my-2 mx-1 h-px lg:h-auto lg:w-px bg-border flex-shrink-0"></div>      
        <section className="lg:w-2/3">
          <h2 className="text-2xl sm:text-xl font-bold text-foreground mb-4">Calendar</h2>
          <DashboardCalendar />
        </section>
      </div>
    </div>
  );
}