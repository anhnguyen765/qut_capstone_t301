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
        <div className="justify-center items-center flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
            <div className="flex items-center justify-center h-full w-full -translate-y-10">
                <h1 className="text-3xl font-bold">2bentrods CRM</h1>
            </div>
            <div className="flex items-center justify-center h-full w-full -translate-y-5">
                <Card className="w-full max-w-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Login</CardTitle>
                    <CardDescription className="text-md">
                    Please enter your credentials to access your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="email@example.com" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="••••••••" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full text-lg" type="submit">
                    Login
                    </Button>
                </CardFooter>
                </Card>
            </div>
        </div>
    );
  }
  