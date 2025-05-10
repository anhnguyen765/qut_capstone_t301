import Image from "next/image";
import { Button } from "./components/ui/button";

export default function Dashboard() {
  return (
    <div className="flex flex-row min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Performance */}
      <div className="flex flex-col px-2 py-7">
        <h1 className="text-2xl sm:text-xl font-bold text-[var(--foreground)]">Performance</h1>
        <h3 className="text-lg sm:text-md font-bold text-[var(--foreground)] py-3">Subscribers</h3>
        <div className="w-[200px] h-[200px] bg-[var(--muted-foreground)]"></div>
        <div className="py-3">
          <div className="flex flex-row">
            <h4 className="text-md font-bold text-[var(--foreground)] grow">Total Subsrcibers</h4>
            <p className="text-[var(--foreground)]">8000</p>
          </div>
          <div className="flex flex-row">
            <h4 className="text-md font-bold text-[var(--foreground)] grow">New Subscribers</h4>
            <p className="text-[var(--foreground)]">8000</p>
          </div>
          <div className="flex flex-row">
            <h4 className="text-md font-bold text-[var(--foreground)] grow">Last Subscribers</h4>
            <p className="text-[var(--foreground)]">8000</p>
          </div>
        </div>
      {/* Last Campaign*/}
        <h3 className="text-lg sm:text-md font-bold text-[var(--foreground)] py-3">Last Campaign</h3>
        <div className="flex flex-row">
          <h4 className="text-md font-bold text-[var(--foreground)] grow">Sent</h4>
          <p className="text-[var(--foreground)]">500</p>
        </div>
        <div className="flex flex-row">
          <h4 className="text-md font-bold text-[var(--foreground)] grow">Opened</h4>
          <p className="text-[var(--foreground)]">400</p>
        </div>
        <div className="flex flex-row">
          <h4 className="text-md font-bold text-[var(--foreground)] grow">Clicked</h4>
          <p className="text-[var(--foreground)]">100</p>
        </div>
        <div className="flex flex-row">
          <h4 className="text-md font-bold text-[var(--foreground)] grow">CTR</h4>
          <p className="text-[var(--foreground)]">25%</p>
        </div>
        {/* Last Campaign*/}
        <h3 className="text-lg sm:text-md font-bold text-[var(--foreground)] py-3">Upcoming Campaigns</h3>
        <div className="flex flex-row">
          <h4 className="text-md font-bold text-[var(--foreground)] grow">Campaign Name</h4>
          <p className="text-[var(--foreground)]">Date</p>
        </div>
        <div className="flex flex-row">
          <h4 className="text-md font-bold text-[var(--foreground)] grow">Campaign Name</h4>
          <p className="text-[var(--foreground)]">Date</p>
        </div>
        <div className="flex flex-row">
          <h4 className="text-md font-bold text-[var(--foreground)] grow">Campaign Name</h4>
          <p className="text-[var(--foreground)]">Date</p>
        </div>
        <div className="flex flex-row">
          <h4 className="text-md font-bold text-[var(--foreground)] grow">Campaign Name</h4>
          <p className="text-[var(--foreground)]">Date</p>
        </div>
        <Button className="w-full h-10 text-md font-bold mt-5" type="submit">
          Create Campaign
        </Button>
      </div>
      <div className="flex flex-col px-2 py-7">
        <h1 className="text-2xl sm:text-xl font-bold text-[var(--foreground)]">This Week's Bookings</h1>
      </div>
    </div>
  );
}