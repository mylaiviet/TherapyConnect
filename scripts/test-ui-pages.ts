import axios from "axios";

const API_BASE = "http://localhost:5000";

async function testPages() {
  console.log("Testing UI Pages...\n");
  console.log("=".repeat(70));

  const pagesToTest = [
    { path: "/", name: "Home Page" },
    { path: "/login", name: "Login Page" },
    { path: "/signup", name: "Signup Page" },
    { path: "/provider-credentialing", name: "Provider Credentialing Portal" },
    { path: "/admin/credentialing", name: "Admin Credentialing Dashboard" },
  ];

  for (const page of pagesToTest) {
    try {
      const response = await axios.get(`${API_BASE}${page.path}`, {
        validateStatus: (status) => status < 500, // Accept any status < 500
      });

      if (response.status === 200) {
        console.log(`✅ ${page.name}: OK (${response.status})`);
      } else if (response.status === 401 || response.status === 403) {
        console.log(`🔒 ${page.name}: Protected (${response.status}) - Login required`);
      } else {
        console.log(`⚠️  ${page.name}: Status ${response.status}`);
      }
    } catch (error: any) {
      console.log(`❌ ${page.name}: Error - ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n🌐 READY TO TEST IN BROWSER!");
  console.log("\n📋 Open these URLs in your browser:");
  console.log("\n1. Signup: http://localhost:5000/signup");
  console.log("   Create a test therapist account");
  console.log("\n2. Provider Portal: http://localhost:5000/provider-credentialing");
  console.log("   Test document uploads and NPI verification");
  console.log("\n3. Admin Dashboard: http://localhost:5000/admin/credentialing");
  console.log("   (Requires admin account)");
  console.log("\n" + "=".repeat(70));
  console.log("\n📖 See TESTING_GUIDE.md for detailed testing instructions");
  console.log("\n");
}

testPages().catch(console.error);
