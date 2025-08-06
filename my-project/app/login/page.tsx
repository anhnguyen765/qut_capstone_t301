"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function Login() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const message = searchParams.get("message");
        if (message) {
            setSuccessMessage(message);
        }
    }, [searchParams]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Login failed");
                }

                // Login successful
                console.log("Login successful:", data);
                
                // Store token in localStorage (you might want to use a more secure method)
                if (data.token) {
                    localStorage.setItem("authToken", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
                
                // Redirect to dashboard after successful login
                router.push("/");
            } catch (error) {
                console.error("Login failed:", error);
                setErrors({ 
                    general: error instanceof Error ? error.message : "Login failed. Please check your credentials." 
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleRegisterRedirect = () => {
        router.push("/register");
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-full p-4">
            <Card className="w-full max-w-md shadow-xl rounded-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-center text-foreground">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        {successMessage && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-600">{successMessage}</p>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="email@example.com"
                                className="h-10"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="h-10"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>
                        <div className="flex items-center justify-end">
                            <Button variant="link" className="h-auto p-0 text-sm">
                                Forgot password?
                            </Button>
                        </div>
                        {errors.general && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{errors.general}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 py-4">
                        <Button 
                            className="w-full h-10 text-md" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                        
                        <div className="text-center text-sm">
                            Don't have an account?{" "}
                            <Button
                                variant="link"
                                className="h-auto p-0 text-sm"
                                onClick={handleRegisterRedirect}
                            >
                                Sign up
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
