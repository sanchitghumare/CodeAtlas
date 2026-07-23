"use client";

import Link from "next/link";
import { GitBranch, ArrowRight, ShieldCheck } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const { status, data: session } = useSession();
  console.log("status:", status);
  console.log("session:", session);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard"); 
    }
  }, [status, router]);
  return (
    <main className="flex min-h-screen items-center justify-center px-6 bg-zinc-900">
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <GitBranch className="h-7 w-7 text-primary" />
          </div>

          <CardTitle className="text-3xl font-bold">
            Welcome to CodeAtlas
          </CardTitle>

          <CardDescription className="text-sm leading-6">
            AI-powered GitHub code reviews with repository-wide reasoning.
            Sign in to review your repositories in seconds.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button
            className="h-11 w-full gap-2 text-base"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          >
            <GitBranch className="h-5 w-5" />
            Continue with GitHub
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              OR
            </span>
            <Separator className="flex-1" />
          </div>

          <Button
            variant="outline"
            className="h-11 w-full justify-between"
          >
            <Link href="/">
              Analyze Public Repository
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />

              <div className="space-y-1 text-sm">
                <p className="font-medium">Your repositories stay yours.</p>

                <p className="text-muted-foreground">
                  GitHub authentication is only used to access repositories you
                  choose to review. CodeAtlas never modifies your code.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}