"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Loader2, ArrowLeft, Shield } from "lucide-react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setError("Email is required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Invalid email format");
            return;
        }

        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setEmail(""); // Clear the form
            } else {
                setError(data.error || "An error occurred");
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.push("/login");
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background py-8 px-[10%]">
            <Card className="w-full max-w-md shadow-xl rounded-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-foreground">
                        Admin Password Reset
                    </CardTitle>
                    <CardDescription className="text-center text-foreground">
                        Enter your admin email address to receive a password reset link
                    </CardDescription>
                </CardHeader>

                {message ? (
                    <CardContent className="grid gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <p className="text-sm text-green-700 dark:text-green-300 text-center">
                                {message}
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={handleBackToLogin}
                            className="w-full"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="grid gap-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                                <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                                    <Shield className="inline h-3 w-3 mr-1" />
                                    Password reset is restricted to admin accounts only
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Admin Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    className="h-10 placeholder:text-grey dark:placeholder:text-white/80"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError(""); // Clear error when typing
                                    }}
                                    required
                                    disabled={isLoading}
                                />
                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 py-4">
                            <Button 
                                className="w-full h-10 text-md" 
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Reset Link...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Send Reset Link
                                    </>
                                )}
                            </Button>
                            
                            <Button
                                variant="outline"
                                className="w-full h-10"
                                onClick={handleBackToLogin}
                                disabled={isLoading}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}