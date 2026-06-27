import { db, isSimulationMode } from './config/firebase.js';
import { analyzeImageWithVision } from './services/visionService.js';
import { analyzeIssue, generatePredictiveInsights } from './services/geminiService.js';

async function runVerification() {
  console.log("🚦 Starting CivicPulse Backend Verification Tests...");
  console.log(`ℹ️ Mode detected: ${isSimulationMode ? "SIMULATION (Local DB Emulator)" : "PRODUCTION (Live Firebase)"}`);

  // Test 1: Database Write & Read
  console.log("\n🧪 Test 1: Verifying Database writes...");
  try {
    const testIssue = {
      title: "Test Pothole",
      category: "pothole",
      severity: 6,
      location: {
        address: "100 Market St, San Francisco, CA",
        latitude: 37.7749,
        longitude: -122.4194
      },
      status: "Reported",
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('issues').add(testIssue);
    console.log(`✅ Database write successful. Generated Doc ID: ${docRef.id}`);

    // Read back
    console.log("🧪 Test 2: Verifying Database reads...");
    const fetched = await db.collection('issues').doc(docRef.id).get();
    if (fetched.exists && fetched.data().title === "Test Pothole") {
      console.log("✅ Database readback successful.");
    } else {
      throw new Error("Readback data mismatch or document not found.");
    }

    // Cleanup
    await db.collection('issues').doc(docRef.id).delete();
    console.log("✅ Database cleanup successful.");
  } catch (err) {
    console.error("❌ Database verification failed:", err.message);
  }

  // Test 2: Vision Service
  console.log("\n🧪 Test 3: Verifying Vision Service (REST/Mock)...");
  try {
    const mockBuffer = Buffer.from("fake-image-content");
    const tags = await analyzeImageWithVision(mockBuffer, "pothole-road-damage.jpg");
    console.log(`✅ Vision Service successful. Extracted tags: [${tags.join(', ')}]`);
  } catch (err) {
    console.error("❌ Vision verification failed:", err.message);
  }

  // Test 3: Gemini Service Issue Analysis
  console.log("\n🧪 Test 4: Verifying Gemini Service Issue Classification...");
  try {
    const tags = ["pothole", "damage", "asphalt"];
    const address = "200 Pine St, San Francisco, CA";
    const result = await analyzeIssue(tags, address, []);
    
    console.log("✅ Gemini Service issue analysis response received:");
    console.log(`   - Category: ${result.category}`);
    console.log(`   - Title: ${result.title}`);
    console.log(`   - Severity: ${result.severity}`);
    console.log(`   - Recommended Authority: ${result.recommendedAuthority}`);
    console.log(`   - Urgency Level: ${result.urgencyLevel}`);
    console.log(`   - Complaint Letter length: ${result.complaintLetter?.length || 0} characters`);
  } catch (err) {
    console.error("❌ Gemini issue analysis verification failed:", err.message);
  }

  // Test 4: Gemini Service Predictive Insights
  console.log("\n🧪 Test 5: Verifying Gemini Service Predictive Insights...");
  try {
    const mockIssues = [
      { id: '1', category: 'water leak', status: 'Reported', severity: 8, createdAt: new Date().toISOString(), location: { address: 'Main St' } },
      { id: '2', category: 'pothole', status: 'Reported', severity: 6, createdAt: new Date().toISOString(), location: { address: 'Broadway Ave' } }
    ];
    const insights = await generatePredictiveInsights("Metro Zone", mockIssues);
    console.log("✅ Gemini Service predictive insights response received:");
    console.log(`   - Predictions Count: ${insights.predictions?.length || 0}`);
    console.log(`   - Priority Actions Count: ${insights.priorityActions?.length || 0}`);
    console.log(`   - High Risk Areas Count: ${insights.riskAreas?.length || 0}`);
  } catch (err) {
    console.error("❌ Gemini insights verification failed:", err.message);
  }

  console.log("\n🏁 Verification test run completed.");
}

runVerification();
