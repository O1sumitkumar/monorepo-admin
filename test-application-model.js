import mongoose from "mongoose";
import Application from "./server/models/Application.js";

const MONGODB_URI = "mongodb://localhost:27017/app-admin";

async function testApplicationModel() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 Testing Application model...");

    // Test creating a simple application
    const testApp = new Application({
      name: "Test App",
      applicationId: "test-app-123",
      description: "Test application",
      status: "active",
    });

    console.log("✅ Application instance created:", testApp);

    // Test saving the application
    const savedApp = await testApp.save();
    console.log("✅ Application saved successfully:", savedApp);

    // Test finding the application
    const foundApp = await Application.findById(savedApp._id);
    console.log("✅ Application found:", foundApp);

    // Clean up
    await Application.findByIdAndDelete(savedApp._id);
    console.log("✅ Test application deleted");

    console.log("🎉 Application model test passed!");
  } catch (error) {
    console.error("❌ Application model test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

testApplicationModel();
