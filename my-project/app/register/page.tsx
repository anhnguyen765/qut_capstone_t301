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
import { EyeClosed, Eye } from "lucide-react";

interface PasswordRequirement {
    label: string;
    met: boolean;
    test: (password: string) => boolean;
}

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        company: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password requirements
    const passwordRequirements: PasswordRequirement[] = [
        {
            label: "At least 8 characters",
            met: false,
            test: (password) => password.length >= 8,
        },
        {
            label: "At least one uppercase letter",
            met: false,
            test: (password) => /[A-Z]/.test(password),
        },
        {
            label: "At least one lowercase letter",
            met: false,
            test: (password) => /[a-z]/.test(password),
        },
        {
            label: "At least one number",
            met: false,
            test: (password) => /\d/.test(password),
        },
        {
            label: "At least one special character",
            met: false,
            test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
        },
    ];

    const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
        if (password.length === 0) return { strength: "", color: "", percentage: 0 };
        
        const metRequirements = passwordRequirements.filter(req => req.test(password)).length;
        const percentage = (metRequirements / passwordRequirements.length) * 100;
        
        if (percentage < 40) return { strength: "Weak", color: "text-red-500", percentage };
        if (percentage < 80) return { strength: "Fair", color: "text-yellow-500", percentage };
        return { strength: "Strong", color: "text-green-500", percentage };
    };

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

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else {
            const unmetRequirements = passwordRequirements.filter(req => !req.test(formData.password));
            if (unmetRequirements.length > 0) {
                newErrors.password = `Password must meet all requirements`;
            }
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = "Please enter a valid phone number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            try {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        password: formData.password,
                        phone: formData.phone || undefined,
                        company: formData.company || undefined,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Registration failed");
                }

                // Registration successful
                console.log("Registration successful:", data);
                
                // Redirect to login page after successful registration
                router.push("/login?message=Registration successful! Please log in.");
            } catch (error) {
                console.error("Registration failed:", error);
                setErrors({ 
                    general: error instanceof Error ? error.message : "Registration failed. Please try again." 
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleLoginRedirect = () => {
        router.push("/login");
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const updatedRequirements = passwordRequirements.map(req => ({
        ...req,
        met: req.test(formData.password)
    }));

    return (
        <div className="flex items-center justify-center min-h-screen w-full">
            <Card className="w-full max-w-md shadow-xl rounded-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Fill in your details to create a new account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="John"
                                    className="h-10"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                                {errors.firstName && (
                                    <p className="text-sm text-red-500">{errors.firstName}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    className="h-10"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                                {errors.lastName && (
                                    <p className="text-sm text-red-500">{errors.lastName}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email *</Label>
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
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-10 pr-10"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeClosed /> : <Eye />}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Password strength:</span>
                                        <span className={passwordStrength.color}>{passwordStrength.strength}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                passwordStrength.percentage < 40 ? 'bg-red-500' :
                                                passwordStrength.percentage < 80 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${passwordStrength.percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <p className="font-medium">Password requirements:</p>
                                        {updatedRequirements.map((req, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className={req.met ? "text-green-500" : "text-red-500"}>
                                                    {req.met ? "✓" : "✗"}
                                                </span>
                                                <span className={req.met ? "text-green-600" : "text-red-600"}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-10 pr-10"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeClosed /> : <Eye />}
                                </button>
                            </div>
                            {formData.confirmPassword && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={formData.password === formData.confirmPassword ? "text-green-500" : "text-red-500"}>
                                        {formData.password === formData.confirmPassword ? "✓" : "✗"}
                                    </span>
                                    <span className={formData.password === formData.confirmPassword ? "text-green-600" : "text-red-600"}>
                                        {formData.password === formData.confirmPassword ? "Passwords match" : "Passwords do not match"}
                                    </span>
                                </div>
                            )}
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                            )}
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
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                        
                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Button
                                variant="link"
                                className="h-auto p-0 text-sm"
                                onClick={handleLoginRedirect}
                            >
                                Sign in
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
} 