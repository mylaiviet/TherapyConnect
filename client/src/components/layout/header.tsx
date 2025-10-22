import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown, LogOut, Shield, Users, BarChart3, Settings, FileCheck } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  // Check if user is authenticated and get role
  const { data: user } = useQuery<{ id: string; email: string; role: string }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const isAdmin = user?.role === "admin";

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      setLocation("/");
      window.location.reload();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold">
                KM
              </div>
              <span className="font-bold text-xl hidden sm:inline-block">KareMatch</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6" data-sidebar>
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

            <Link href="/blog">
              <span
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  isActive("/blog") || location.startsWith("/blog/") ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="nav-blog"
              >
                Blog
              </span>
            </Link>

            {/* Admin Dropdown - Only visible to admins */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-sm font-medium text-primary hover:text-primary/80 cursor-pointer">
                  <Shield className="mr-1 h-4 w-4" />
                  Admin <ChevronDown className="ml-1 h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer w-full">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin#therapists" className="cursor-pointer w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Therapists
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin#analytics" className="cursor-pointer w-full">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin#insights" className="cursor-pointer w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Business Intelligence
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/credentialing" className="cursor-pointer w-full">
                      <FileCheck className="mr-2 h-4 w-4" />
                      Credentialing
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Show Dashboard and Credentialing links for logged-in users */}
            {user && !isAdmin && (
              <>
                <Link href="/therapist-dashboard">
                  <span
                    className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                      isActive("/therapist-dashboard") ? "text-primary" : "text-muted-foreground"
                    }`}
                    data-testid="nav-therapist-dashboard"
                  >
                    Dashboard
                  </span>
                </Link>
                <Link href="/provider-credentialing">
                  <span
                    className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                      isActive("/provider-credentialing") ? "text-primary" : "text-muted-foreground"
                    }`}
                    data-testid="nav-provider-credentialing"
                  >
                    Credentialing
                  </span>
                </Link>
              </>
            )}

            {!user ? (
              <>
                <Link href="/login">
                  <span
                    className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                      isActive("/login") ? "text-primary" : "text-muted-foreground"
                    }`}
                    data-testid="nav-user-sign-in"
                  >
                    User Sign In
                  </span>
                </Link>
                <Button asChild size="sm" data-testid="nav-join-button">
                  <Link href="/signup">Join as Therapist</Link>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="nav-logout-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" data-testid="button-mobile-menu">
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
                    className="text-lg font-medium cursor-pointer block"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-nav-find-therapists"
                  >
                    Find Therapists
                  </span>
                </Link>

                <Link href="/blog">
                  <span
                    className="text-lg font-medium cursor-pointer block"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-nav-blog"
                  >
                    Blog
                  </span>
                </Link>

                {/* Admin Section - Only visible to admins */}
                {isAdmin && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs font-semibold text-primary mb-3 flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      ADMIN
                    </p>
                    <div className="space-y-3">
                      <Link href="/admin">
                        <span
                          className="text-base font-medium cursor-pointer block flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </span>
                      </Link>
                      <Link href="/admin#therapists">
                        <span
                          className="text-base font-medium cursor-pointer block flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Manage Therapists
                        </span>
                      </Link>
                      <Link href="/admin#analytics">
                        <span
                          className="text-base font-medium cursor-pointer block flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </span>
                      </Link>
                      <Link href="/admin#insights">
                        <span
                          className="text-base font-medium cursor-pointer block flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Business Intelligence
                        </span>
                      </Link>
                      <Link href="/admin/credentialing">
                        <span
                          className="text-base font-medium cursor-pointer block flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <FileCheck className="h-4 w-4 mr-2" />
                          Credentialing
                        </span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Show Dashboard and Credentialing for logged-in non-admin users */}
                {user && !isAdmin && (
                  <div className="border-t pt-4 mt-4">
                    <Link href="/therapist-dashboard">
                      <span
                        className="text-lg font-medium cursor-pointer block mb-3"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="mobile-nav-therapist-dashboard"
                      >
                        Dashboard
                      </span>
                    </Link>
                    <Link href="/provider-credentialing">
                      <span
                        className="text-lg font-medium cursor-pointer block"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="mobile-nav-provider-credentialing"
                      >
                        Credentialing
                      </span>
                    </Link>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  {!user ? (
                    <>
                      <Link href="/login">
                        <span
                          className="text-lg font-medium cursor-pointer block mb-3"
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid="mobile-nav-user-sign-in"
                        >
                          User Sign In
                        </span>
                      </Link>
                      <Button
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="mobile-nav-join-button"
                        className="w-full"
                      >
                        <Link href="/signup">Join as Therapist</Link>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      disabled={logoutMutation.isPending}
                      className="w-full"
                      data-testid="mobile-nav-logout-button"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
