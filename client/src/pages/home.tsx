import { Link } from "wouter";
import { Search, CheckCircle, UserPlus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import WelcomeModal from "@/components/WelcomeModal";

const FEATURED_SPECIALTIES = [
  { name: "Anxiety", icon: "🧠", count: "150+ therapists" },
  { name: "Depression", icon: "💙", count: "140+ therapists" },
  { name: "Trauma & PTSD", icon: "🌟", count: "95+ therapists" },
  { name: "Relationship Issues", icon: "💑", count: "110+ therapists" },
  { name: "Life Transitions", icon: "🌱", count: "85+ therapists" },
  { name: "Grief & Loss", icon: "🕊️", count: "75+ therapists" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Search & Filter",
    description: "Find therapists by location, specialty, insurance, and more",
    icon: Search,
  },
  {
    step: "2",
    title: "Review Profiles",
    description: "Read detailed bios, credentials, and specializations",
    icon: CheckCircle,
  },
  {
    step: "3",
    title: "Connect Directly",
    description: "Contact therapists directly via phone or email",
    icon: Calendar,
  },
];

export default function Home() {
  const [searchLocation, setSearchLocation] = useState("");
  const [searchSpecialty, setSearchSpecialty] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (searchSpecialty) params.set("specialty", searchSpecialty);
    window.location.href = `/therapists?${params.toString()}`;
  };

  return (
    <div className="min-h-screen">
      {/* Welcome Modal */}
      <WelcomeModal />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
              Find Your Perfect Therapist
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">
              Connect with verified, licensed mental health professionals who specialize in your needs
            </p>

            {/* Search Bar */}
            <Card className="max-w-3xl mx-auto shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="City or ZIP code"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="h-12 text-base"
                      data-testid="input-search-location"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Specialty (e.g., Anxiety, Depression)"
                      value={searchSpecialty}
                      onChange={(e) => setSearchSpecialty(e.target.value)}
                      className="h-12 text-base"
                      data-testid="input-search-specialty"
                    />
                  </div>
                  <Button
                    size="lg"
                    className="h-12 px-8"
                    onClick={handleSearch}
                    data-testid="button-search-therapists"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild variant="outline" data-testid="button-join-therapist">
                <Link href="/signup">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Join as a Therapist
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Verified Therapists</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Specializations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Licensed Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Search Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Finding the right therapist is simple and straightforward
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((item) => (
              <Card key={item.step} className="text-center hover-elevate active-elevate-2">
                <CardContent className="pt-8 pb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Specialties */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Browse by Specialty</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Find therapists who specialize in your specific needs
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {FEATURED_SPECIALTIES.map((specialty) => (
              <Link
                key={specialty.name}
                href={`/therapists?specialty=${encodeURIComponent(specialty.name)}`}
              >
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{specialty.icon}</div>
                    <h3 className="font-semibold mb-2">{specialty.name}</h3>
                    <p className="text-sm text-muted-foreground">{specialty.count}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button size="lg" asChild data-testid="button-view-all-therapists">
              <Link href="/therapists">View All Therapists</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Your mental health journey begins with finding the right therapist
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-cta-find-therapist">
              <Link href="/therapists">
                <Search className="mr-2 h-5 w-5" />
                Find a Therapist
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-cta-join">
              <Link href="/signup">
                <UserPlus className="mr-2 h-5 w-5" />
                Join as a Therapist
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
