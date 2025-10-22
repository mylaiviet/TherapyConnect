import axios from "axios";

const API_BASE = "http://localhost:5000";

async function createTestAccounts() {
  console.log("Creating test accounts via API...\n");

  try {
    // Create admin account
    console.log("Creating admin account...");
    try {
      const adminResponse = await axios.post(`${API_BASE}/api/auth/signup`, {
        email: "admin@therapyconnect.com",
        password: "admin123",
        userType: "admin",
        fullName: "Admin User"
      });
      console.log("✅ Admin account created");
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.data?.message?.includes("already exists")) {
        console.log("ℹ️  Admin account already exists");
      } else {
        console.error("❌ Error creating admin:", error.response?.data || error.message);
      }
    }

    // Create therapist account
    console.log("\nCreating test therapist account...");
    try {
      const therapistResponse = await axios.post(`${API_BASE}/api/auth/signup`, {
        email: "test.therapist@example.com",
        password: "therapist123",
        userType: "therapist",
        fullName: "Dr. Test Therapist",
        credentials: "PhD, LCSW",
        specialty: "Clinical Psychology"
      });
      console.log("✅ Test therapist account created");
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.data?.message?.includes("already exists")) {
        console.log("ℹ️  Test therapist account already exists");
      } else {
        console.error("❌ Error creating therapist:", error.response?.data || error.message);
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("TEST ACCOUNTS READY!");
    console.log("=".repeat(70));
    console.log("\n📋 Login Information:");
    console.log("\n1. Admin Credentialing Dashboard:");
    console.log("   URL: http://localhost:5000/admin/credentialing");
    console.log("   Email: admin@therapyconnect.com");
    console.log("   Password: admin123");

    console.log("\n2. Provider Credentialing Portal:");
    console.log("   URL: http://localhost:5000/provider-credentialing");
    console.log("   Email: test.therapist@example.com");
    console.log("   Password: therapist123");

    console.log("\n" + "=".repeat(70));
    console.log("\n🌐 Open your browser and navigate to these URLs to test!");
    console.log("\n📝 Testing Checklist:");
    console.log("   □ Log in as admin and view credentialing dashboard");
    console.log("   □ Log in as therapist and access provider portal");
    console.log("   □ Upload test documents (license, insurance, etc.)");
    console.log("   □ Test NPI verification");
    console.log("   □ Test admin review and approval workflow");
    console.log("\n");

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    throw error;
  }
}

createTestAccounts()
  .then(() => {
    console.log("✅ Test accounts setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed to create test accounts:", error);
    process.exit(1);
  });
