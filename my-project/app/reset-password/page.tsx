"use client";

import { useState, useEffect, Suspense } from "react";
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
import { Loader2, Shield, Eye, EyeOff, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState("");
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    useEffect(() => {
        const tokenParam = searchParams.get("token");
        if (tokenParam) {
            setToken(tokenParam);
            // Validate token format
            if (!/^[a-f0-9]{64}$/i.test(tokenParam)) {
                setError("Invalid reset token format");
                setTokenValid(false);
            } else {
                setTokenValid(true);
            }
        } else {
            setError("No reset token provided");
            setTokenValid(false);
        }
    }, [searchParams]);

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        
        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter");
        }
        if (!/[0-9]/.test(password)) {
            errors.push("Password must contain at least one number");
        }
        
        return errors;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(""); // Clear error when typing
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            setError("No reset token available");
            return;
        }

        if (!formData.password || !formData.confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
            setError(passwordErrors[0]);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login?message=Password reset successful. Please log in with your new password.");
                }, 3000);
            } else {
                setError(data.error || "Failed to reset password");
            }
        } catch (error) {
            console.error("Reset password error:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (tokenValid === false) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background py-8 px-[10%]">
                <Card className="w-full max-w-md shadow-xl rounded-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-destructive">
                            Invalid Reset Link
                        </CardTitle>
                        <CardDescription className="text-center text-foreground">
                            The password reset link is invalid or has expired
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive text-center">
                                {error || "Please request a new password reset link"}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full" 
                            onClick={() => router.push("/forgot-password")}
                        >
                            Request New Reset Link
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background py-8 px-[10%]">
                <Card className="w-full max-w-md shadow-xl rounded-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-center text-foreground">
                            Password Reset Successful
                        </CardTitle>
                        <CardDescription className="text-center text-foreground">
                            Your admin password has been successfully updated
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <p className="text-sm text-green-700 dark:text-green-300 text-center">
                                Redirecting to login page...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                        Reset Admin Password
                    </CardTitle>
                    <CardDescription className="text-center text-foreground">
                        Enter your new password below
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    className="h-10 pr-10"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    className="h-10 pr-10"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Password requirements:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>At least 8 characters long</li>
                                <li>One uppercase letter</li>
                                <li>One lowercase letter</li>
                                <li>One number</li>
                            </ul>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 py-4">
                        <Button 
                            className="w-full h-10 text-md" 
                            type="submit"
                            disabled={isLoading || tokenValid === null}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}