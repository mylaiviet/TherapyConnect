import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3">KareMatch</h3>
            <p className="text-sm text-muted-foreground">
              Connecting you with qualified, licensed therapists in your area.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">For Patients</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/therapists" className="text-muted-foreground hover:text-primary">
                  Find a Therapist
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary">
                  User Sign In
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-muted-foreground hover:text-primary">
                  Insights
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">For Therapists</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/signup" className="text-muted-foreground hover:text-primary">
                  Join Our Network
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary">
                  Therapist Sign In
                </Link>
              </li>
              <li>
                <Link href="/therapist-dashboard" className="text-muted-foreground hover:text-primary">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KareMatch. All rights reserved.</p>
          <p className="mt-2">
            This is a HIPAA-exempt directory service. No patient information is collected.
          </p>
        </div>
      </div>
    </footer>
  );
}
