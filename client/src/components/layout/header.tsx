import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold">
                TC
              </div>
              <span className="font-bold text-xl hidden sm:inline-block">TherapyConnect</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" data-sidebar>
            <Link href="/therapists">
              <span
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  isActive("/therapists") ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="nav-find-therapists"
              >
                Find Therapists
              </span>
            </Link>
            <Link href="/login">
              <span
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  isActive("/login") ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="nav-sign-in"
              >
                Sign In
              </span>
            </Link>
            <Button asChild size="sm" data-testid="nav-join-button">
              <Link href="/signup">Join as Therapist</Link>
            </Button>
          </nav>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-6">
                <Link href="/therapists">
                  <span
                    className="text-lg font-medium cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-nav-find-therapists"
                  >
                    Find Therapists
                  </span>
                </Link>
                <Link href="/login">
                  <span
                    className="text-lg font-medium cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-nav-sign-in"
                  >
                    Sign In
                  </span>
                </Link>
                <Button asChild onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-join-button">
                  <Link href="/signup">Join as Therapist</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
