import axios from "axios";

// Test to see what data the API returns
async function testApiData() {
  try {
    console.log("🧪 Testing API data...");

    // Test the accounts API
    const response = await axios.get("http://localhost:5000/api/v1/accounts");
    console.log("📊 API Response:", response.data);

    if (response.data.accounts && response.data.accounts.length > 0) {
      const firstAccount = response.data.accounts[0];
      console.log("🎯 First account:", firstAccount);
      console.log(
        "📋 First account sharedAccounts:",
        firstAccount.sharedAccounts
      );

      // Check if sharedAccounts field exists
      if (firstAccount.sharedAccounts) {
        console.log("✅ sharedAccounts field exists");
        console.log("📝 sharedAccounts value:", firstAccount.sharedAccounts);
        console.log(
          "📝 sharedAccounts type:",
          typeof firstAccount.sharedAccounts
        );
        console.log(
          "📝 sharedAccounts length:",
          firstAccount.sharedAccounts.length
        );
      } else {
        console.log("❌ sharedAccounts field missing");
      }
    } else {
      console.log("❌ No accounts found in response");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testApiData();
