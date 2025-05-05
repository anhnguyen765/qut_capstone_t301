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
    return (
        <div className="flex items-center justify-center h-full w-full -translate-y-5">
            <Card className="w-full max-w-md shadow-lg rounded-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            className="h-10"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="h-10"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-end">
                        <Button variant="link" className="h-auto p-0 text-sm">
                            Forgot password?
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full h-10 text-md" type="submit">
                        Sign In
                    </Button>
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" className="h-10">
                            Google
                        </Button>
                        <Button variant="outline" className="h-10">
                            Microsoft
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
