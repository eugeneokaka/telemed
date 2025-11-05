"use client";

import { login, signup } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";

export default function LoginPage() {
  async function handleAction(
    actionFn: (formData: FormData) => Promise<any>,
    formData: FormData
  ) {
    try {
      await actionFn(formData);
      toast.success("Success!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <Toaster position="top-center" />
      <Card className="w-full max-w-md shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Welcome Back 👋
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                type="submit"
                formAction={async (formData) => handleAction(login, formData)}
                className="w-full"
              >
                Log in
              </Button>

              <Button
                type="submit"
                formAction={async (formData) => handleAction(signup, formData)}
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-100"
              >
                Sign up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
