import Link from "next/link";
import { ArrowRight, GraduationCap, Server, Shield, Users } from "lucide-react";

import { Button } from "@midori/components/ui/button";
import { Badge } from "@midori/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { ThemeToggleButton } from "@midori/components/shared/ThemeToggleButton";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="size-5 text-primary" />
            <span className="font-semibold">FITM Cloud</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="px-3 py-1">
              Department of Information Technology
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              VM Platform for{" "}
              <span className="text-primary">Academic Activities</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Cluster-based virtual machine platform supporting teaching and
              research activities at King Mongkut's University of Technology
              North Bangkok.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-4">
            <Badge variant="outline" className="text-xs">
              <a
                href="https://www.kmutnb.ac.th"
                target="_blank"
                rel="noopener noreferrer"
              >
                KMUTNB
              </a>
            </Badge>
            <Badge variant="outline" className="text-xs">
              <a
                href="https://fitm.kmutnb.ac.th"
                target="_blank"
                rel="noopener noreferrer"
              >
                FITM
              </a>
            </Badge>
            <Badge variant="outline" className="text-xs">
              <a
                href="https://sites.google.com/itm.kmutnb.ac.th/it-fitm"
                target="_blank"
                rel="noopener noreferrer"
              >
                IT Department
              </a>
            </Badge>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Platform Features
            </h2>
            <p className="text-muted-foreground">
              Everything you need for academic computing
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  VM Management
                </CardTitle>
                <Server className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create, manage, and monitor Linux virtual machines with ease.
                  Full control over your computing resources.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Multi-User Support
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Support for students, instructors, and administrators with
                  role-based access control.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Secure Access
                </CardTitle>
                <Shield className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Google OAuth integration with university domain verification
                  for secure authentication.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Our Services</h2>
            <p className="text-muted-foreground">
              Supporting education and research
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
            <Card className="group transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Educational Support
                </CardTitle>
                <GraduationCap className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Providing virtual machines for academic projects, coursework,
                  and research activities.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Resource Management
                </CardTitle>
                <Server className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Efficient allocation and management of virtual resources for
                  students and faculty.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} FITM Cloud. For educational purposes
            only.
          </p>
        </div>
      </footer>
    </div>
  );
}
