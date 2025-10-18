import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3">TherapyConnect</h3>
            <p className="text-sm text-muted-foreground">
              Connecting you with qualified, licensed therapists in your area.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">For Patients</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/therapists">
                  <a className="text-muted-foreground hover:text-primary">Find a Therapist</a>
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">How It Works</a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">FAQs</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">For Therapists</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/signup">
                  <a className="text-muted-foreground hover:text-primary">Join Our Network</a>
                </Link>
              </li>
              <li>
                <Link href="/login">
                  <a className="text-muted-foreground hover:text-primary">Therapist Login</a>
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">Pricing</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">About Us</a>
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
          <p>&copy; {new Date().getFullYear()} TherapyConnect. All rights reserved.</p>
          <p className="mt-2">
            This is a HIPAA-exempt directory service. No patient information is collected.
          </p>
        </div>
      </div>
    </footer>
  );
}
