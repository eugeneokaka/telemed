"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // ✅ spinner icon

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";

export default function LoginSignupPage() {
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);

  // ✅ LOGIN HANDLER
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoadingLogin(true);
    const result = await login(formData);
    setLoadingLogin(false);

    if (result?.error) return toast.error(result.error);

    toast.success("Welcome back!");
    window.location.href = "/";
  }

  // ✅ SIGNUP HANDLER
  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoadingSignup(true);
    const result = await signup(formData);
    setLoadingSignup(false);

    if (result?.error) return toast.error(result.error);

    toast.success("Account created! Redirecting...");
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-xl shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Welcome
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ✅ LOGIN TAB */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="grid gap-4">
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" required />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input name="password" type="password" required />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loadingLogin}
                >
                  {loadingLogin ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ✅ SIGNUP TAB */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input name="first_name" required />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input name="last_name" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age</Label>
                    <Input name="age" type="number" required />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select name="gender" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Role</Label>
                  <Select name="role" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" required />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input name="password" type="password" required />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loadingSignup}
                >
                  {loadingSignup ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="text-center text-sm text-gray-500">
          Secure authentication powered by Supabase
        </CardFooter>
      </Card>
    </div>
  );
}
