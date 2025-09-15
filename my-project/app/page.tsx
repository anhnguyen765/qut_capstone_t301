import DashboardCalendar from "./components/DashboardCalendar";
import Performance from "./components/Performance";

export default function Dashboard() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <section className="lg:w-1/3">
        <h1 className="text-2xl sm:text-xl font-bold text-foreground mb-4">Performance</h1>
        <Performance />
      </section>
      <div className="my-2 mx-1 h-px lg:h-auto lg:w-px bg-border flex-shrink-0"></div>      
      <section className="lg:w-2/3">
        <h1 className="text-2xl sm:text-xl font-bold text-foreground mb-4">Calendar</h1>
        <DashboardCalendar />
      </section>
    </div>
  );
}