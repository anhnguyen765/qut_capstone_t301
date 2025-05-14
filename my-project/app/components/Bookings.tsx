"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";

type Booking = {
    id: string;
    name: string;
    date: string;
    time: string;
    staff: string;
    status: "confirmed" | "pending" | "cancelled";
};

const bookings: Booking[] = [
    {
        id: "1",
        name: "John Doe",
        date: "2025-05-10",
        time: "10:00 AM",
        status: "confirmed",
        staff: "Alice",
    },
    {
        id: "2",
        name: "Jane Smith",
        date: "2025-05-11",
        time: "2:00 PM",
        status: "pending",
        staff: "Bob",
    },
    {
        id: "3",
        name: "Michael Brown",
        date: "2025-05-12",
        time: "11:30 AM",
        status: "cancelled",
        staff: "Charlie",
    },
    {
        id: "4",
        name: "Emily Johnson",
        date: "2025-05-13",
        time: "9:00 AM",
        status: "confirmed",
        staff: "David",
    },
    {
        id: "5",
        name: "David Wilson",
        date: "2025-05-14",
        time: "1:00 PM",
        status: "pending",
        staff: "Eve",
    },
    {
        id: "6",
        name: "Sarah Davis",
        date: "2025-05-15",
        time: "3:30 PM",
        status: "cancelled",
        staff: "Frank",
    },
];

export default function Bookings() {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("");
    const [sortOption, setSortOption] = useState<string>("date-asc");

    const filteredBookings = bookings
        .filter((booking) => {
            if (statusFilter === "all") return true;
            return booking.status === statusFilter;
        })
        .filter((booking) => {
            if (!dateFilter) return true;
            return booking.date === dateFilter;
        })
        .sort((a, b) => {
            switch (sortOption) {
                case "date-asc":
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case "date-desc":
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "name-desc":
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });

    const resetFilters = () => {
        setStatusFilter("all");
        setDateFilter("");
        setSortOption("date-asc");
    };

    return (
        <div className="w-full space-y-6">
            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-background">
                <div className="w-full sm:w-[125px]">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full truncate text-muted-foreground">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <Input
                        className="w-full text-muted-foreground"
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Sort By</label>
                    <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger className="w-full truncate text-muted-foreground">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                            <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-end">
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="w-full font-medium text-muted-foreground"
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            {/* Bookings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBookings.map((booking) => (
                    <Card key={booking.id} className="rounded-2xl shadow-md">
                        <CardContent className="p-4 space-y-2">
                            <div className="text-lg font-semibold text-[var(--foreground)]">
                                {booking.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {new Date(booking.date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}{" "}
                                at {booking.time}
                            </div>
                            <div className="text-sm text-foreground">
                                Staff: {booking.staff}
                            </div>
                            <div
                                className={`text-sm font-medium ${booking.status === "confirmed"
                                    ? "text-green-600"
                                    : booking.status === "pending"
                                        ? "text-yellow-500"
                                        : "text-red-500"
                                    }`}
                            >
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </div>
                            <Button variant="outline" className="mt-2 w-full">
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredBookings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No bookings match your filters
                </div>
            )}
        </div>
    );
}