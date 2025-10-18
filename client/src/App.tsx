import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TherapistSearch from "@/pages/therapist-search";
import TherapistProfile from "@/pages/therapist-profile";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import TherapistDashboard from "@/pages/therapist-dashboard";
import ProfileEditor from "@/pages/profile-editor";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/therapists" component={TherapistSearch} />
      <Route path="/therapists/:id" component={TherapistProfile} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" component={TherapistDashboard} />
      <Route path="/dashboard/profile" component={ProfileEditor} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
