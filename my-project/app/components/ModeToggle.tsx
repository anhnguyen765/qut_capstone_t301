"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/app/components/ui/button";
import { useEffect, useState } from "react";


export function ModeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Button variant="ghost" className="w-10 px-0 h-10" />;
    }

    return (
        <Button
            variant="ghost"
            className="w-10 px-0 h-10"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            {theme === "dark" ? <Moon className="text-[var(--foreground)] h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
    );
}