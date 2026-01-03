"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, Server } from "lucide-react";

import { authClient } from "@midori/lib/auth-client";
import { useSession } from "@midori/hooks/useSession";
import { Button } from "@midori/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Input } from "@midori/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@midori/components/ui/field";
import { Google } from "@midori/components/icons/google";

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSession();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isDevMode = process.env.APP_ENV !== "production";

  // Redirect to dashboard if already authenticated
  // Don't redirect if there's a session error (e.g., after signout)
  useEffect(() => {
    if (isAuthenticated && !isSessionLoading && !sessionError) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isSessionLoading, sessionError, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      setError("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });
      if (result.error) {
        setError(
          result.error.message || "Failed to sign in. Please try again.",
        );
        setIsEmailLoading(false);
      }
    } catch {
      setError("Failed to sign in. Please try again.");
      setIsEmailLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            {/* <span className="text-2xl font-bold">FC</span> */}
            <Server className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FITM Cloud</h1>
          <p className="text-muted-foreground text-sm">
            Cloud Platform for Students and Educators
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-xl backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full gap-3"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isEmailLoading}
            >
              {isGoogleLoading ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <Google className="size-5" />
              )}
              Continue with Google
            </Button>

            {/* Dev Mode Email/Password Login */}
            {isDevMode && (
              <>
                <FieldSeparator>or</FieldSeparator>

                <form onSubmit={handleEmailSignIn}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={isEmailLoading || isGoogleLoading}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={isEmailLoading || isGoogleLoading}
                      />
                    </Field>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isEmailLoading || isGoogleLoading}
                    >
                      {isEmailLoading ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in with Email"
                      )}
                    </Button>

                    <FieldError>
                      <p className="text-center text-xs text-muted-foreground">
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
                          Development Mode
                        </span>{" "}
                        Email login is only available in development.
                      </p>
                    </FieldError>
                  </FieldGroup>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <a
            href="/terms"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
