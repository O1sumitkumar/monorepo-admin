import axios from "axios";

// Test the account sharing update functionality
async function testSharingUpdate() {
  try {
    console.log("🧪 Testing Account Sharing Update...");

    // First, get all accounts to find one to test with
    const accountsResponse = await axios.get(
      "http://localhost:5000/api/v1/accounts",
      {
        headers: {
          Authorization: "Bearer test-token", // You'll need to replace this with a real token
        },
      }
    );
    console.log(
      "📋 Available accounts:",
      accountsResponse.data.data?.length || 0
    );

    if (accountsResponse.data.data && accountsResponse.data.data.length > 0) {
      const testAccount = accountsResponse.data.data[0];
      console.log("🎯 Testing with account:", testAccount.name);
      console.log("📊 Current sharedAccounts:", testAccount.sharedAccounts);

      // Test updating the sharedAccounts field
      const updateData = {
        sharedAccounts: ["user-001", "user-002", "user-003"],
      };

      console.log("📤 Sending update request with data:", updateData);

      const updateResponse = await axios.put(
        `http://localhost:5000/api/v1/accounts/${testAccount.id}`,
        updateData,
        {
          headers: {
            Authorization: "Bearer test-token", // You'll need to replace this with a real token
          },
        }
      );

      console.log("✅ Update successful!");
      console.log("📊 Updated account:", updateResponse.data);

      // Verify the update
      const verifyResponse = await axios.get(
        `http://localhost:5000/api/v1/accounts/${testAccount.id}`,
        {
          headers: {
            Authorization: "Bearer test-token", // You'll need to replace this with a real token
          },
        }
      );
      console.log("🔍 Verification - Updated account:", verifyResponse.data);
    } else {
      console.log("❌ No accounts found to test with");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log("🔐 Authentication required. Please provide a valid token.");
    }
  }
}

// Run the test
testSharingUpdate();
