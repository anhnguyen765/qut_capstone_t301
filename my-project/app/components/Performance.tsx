"use client";

import Link from "next/link";
import { BarChart, Bar } from "recharts";
import { ChartContainer, ChartConfig } from "@/app/components/ui/chart";
import { Button } from "@/app/components/ui/button";

const chartData = [
  { day: "Mon", subscribe: 4000 },
  { day: "Tue", subscribe: 3000 },
  { day: "Wed", subscribe: 2000 },
  { day: "Thu", subscribe: 2780 },
  { day: "Fri", subscribe: 1890 },
  { day: "Sat", subscribe: 2390 },
  { day: "Sun", subscribe: 3490 },
];

const chartConfig = {
  subscribe: {
    label: "Subscribers",
    color: "#6366f1",
  },
} satisfies ChartConfig;

export default function Performance() {
  return (
    <div className="flex-1 flex flex-col w-full max-w-full space-y-4 sm:space-y-6">
      {/* Subscribers Chart */}
      <section className="space-y-2 sm:space-y-3">
        <h3 className="text-md sm:text-lg font-bold text-[var(--foreground)]">Subscribers</h3>
        <ChartContainer config={chartConfig} className="min-h-[150px] sm:min-h-[200px] w-full">
          <BarChart data={chartData}>
            <Bar dataKey="subscribe" fill="var(--foreground)" radius={4} />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <Metric label="Total" value="8000" />
          <Metric label="New" value="1200" />
          <Metric label="Last Week" value="1000" />
        </div>
      </section>

      {/* Last Campaign */}
      <section className="space-y-2 sm:space-y-3">
        <h3 className="text-md sm:text-lg font-bold text-[var(--foreground)]">Last Campaign</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Metric label="Sent" value="500" />
          <Metric label="Opened" value="400" />
          <Metric label="Clicked" value="100" />
          <Metric label="CTR" value="25%" />
        </div>
      </section>

      {/* Upcoming Campaigns */}
      <section className="space-y-2 sm:space-y-3">
        <h3 className="text-md sm:text-lg font-bold text-[var(--foreground)]">Upcoming</h3>
        <div className="space-y-1 sm:space-y-2">
          {["Summer Sale", "Product Launch", "Webinar Reminder", "Holiday Promo"].map((name, i) => (
            <div key={i} className="flex justify-between text-sm sm:text-md text-[var(--foreground)]">
              <h4 className="font-bold truncate pr-2">{name}</h4>
              <p className="whitespace-nowrap">{`${10 + i}-06-25`}</p>
            </div>
          ))}
        </div>
        <Link href="/campaigns/create" className="w-full">
            <Button className="w-full h-8 sm:h-10 text-sm sm:text-md font-bold mt-1 sm:mt-2" type="submit">
            Create New Email Campaign
            </Button>
        </Link>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg sm:rounded-xl bg-muted p-2 sm:p-3 shadow-sm">
      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</h4>
      <p className="text-md sm:text-xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}