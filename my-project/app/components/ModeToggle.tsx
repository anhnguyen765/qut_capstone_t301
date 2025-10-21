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
            className="w-10 px-0 h-10 hover:bg-accent"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            {theme === "dark" ? (
                <Moon className="h-4 w-4 text-foreground" />
            ) : (
                <Sun className="h-4 w-4 text-foreground" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}