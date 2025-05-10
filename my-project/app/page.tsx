import Bookings from "./components/Bookings";
import Performance from "./components/Performance";

export default function Dashboard() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 min-h-screen font-[family-name:var(--font-geist-sans)] w-full">
      <section>
        <h1 className="text-2xl sm:text-xl font-bold text-foreground">Performance</h1>
        <div className="w-full max-w-full mt-4">
          <Performance />
        </div>
      </section>
      <div className="my-2 mx-1 h-px lg:h-auto lg:w-px bg-border flex-shrink-0"></div>      <section className="flex-1 flex flex-col w-full min-h-screen">
        <h1 className="text-2xl sm:text-xl font-bold text-foreground)">This Week's Bookings</h1>
        <div className="w-full max-w-full mt-4">
          <Bookings />
        </div>
      </section>
    </div>
  );
}