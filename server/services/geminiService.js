import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let model = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    console.log("🌟 Gemini 1.5 Flash initialized in PRODUCTION mode.");
  } catch (error) {
    console.error(`⚠️ Failed to initialize Gemini client: ${error.message}`);
  }
}

/**
 * Categorize and generate report details for a civic issue.
 * @param {string[]} visionTags - Labels/objects detected in the image.
 * @param {string} locationAddress - Location/address text.
 * @param {any[]} existingIssues - List of active issues in the area (for duplication check).
 * @returns {Promise<object>} Parsed Gemini JSON analysis.
 */
export const analyzeIssue = async (visionTags, locationAddress, existingIssues = []) => {
  const visionString = visionTags.join(', ');
  const issuesSummary = existingIssues.map(issue => 
    `ID: ${issue.id}, Category: ${issue.category}, Title: ${issue.title}, Address: ${issue.location?.address}, Severity: ${issue.severity}`
  ).join('\n');

  const prompt = `
You are a civic issue analysis AI. Given this image description (detected tags): [${visionString}] at location [${locationAddress}].
Analyze and return JSON matching this exact structure:
{
  "category": "pothole" | "water leak" | "streetlight" | "waste" | "other",
  "title": "A short, clear title for the issue",
  "description": "A detailed, professional description of the civic problem",
  "severity": number between 1 and 10,
  "urgencyLevel": "low" | "medium" | "high" | "critical",
  "estimatedResolutionDays": number of days,
  "recommendedAuthority": "e.g., Municipal Corporation Road Department, Water Supply Board, Electricity Board, Sanitation Department",
  "isDuplicate": boolean (set to true ONLY if there is an issue in the existing reports list that refers to the exact same physical issue at the same location),
  "similarIssueIds": [array of similar issue string IDs from the existing list within close range],
  "complaintLetter": "A formal, polite, structured complaint letter addressed to the recommended authority that the citizen can copy and send. Include placeholders like [Your Name], [Contact Details], and [Date] inside square brackets."
}

Here are the existing active issues reported nearby (within 2km):
${issuesSummary || 'None reported nearby.'}
`;

  if (!model) {
    console.log("ℹ️ Gemini API not configured or failed to start. Running simulation mode...");
    return simulateIssueAnalysis(visionTags, locationAddress, existingIssues);
  }

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonResult = JSON.parse(text);
    console.log("✅ Gemini successfully analyzed issue.");
    return jsonResult;
  } catch (error) {
    console.error(`⚠️ Gemini API call failed (${error.message}). Falling back to simulation...`);
    return simulateIssueAnalysis(visionTags, locationAddress, existingIssues);
  }
};

/**
 * Generate predictive insights for a given area based on past reports.
 * @param {string} area - Area/zone name.
 * @param {any[]} issues - Issues in the last 30 days.
 * @returns {Promise<object>} Predictive insights JSON.
 */
export const generatePredictiveInsights = async (area, issues) => {
  const issuesJson = JSON.stringify(issues.map(i => ({
    id: i.id,
    category: i.category,
    status: i.status,
    severity: i.severity,
    createdAt: i.createdAt,
    location: i.location?.address
  })));

  const prompt = `
Analyze these civic issues from the past 30 days in [${area}]: ${issuesJson}.
Identify patterns, predict which unresolved issues risk escalating (e.g. road damage from water leaks, safety hazards from dark streets), and suggest 3 priority actions for local authorities.

Return as JSON matching this structure:
{
  "predictions": [
    {
      "escalationRisk": "high" | "medium" | "low",
      "summary": "Detailed prediction string describing what will happen if issues remain unresolved",
      "impactTimeframe": "e.g., 2 weeks, 1 month",
      "linkedIssues": ["list of affected issue IDs"]
    }
  ],
  "priorityActions": [
    {
      "action": "Clear description of action authority should take",
      "urgency": "immediate" | "medium" | "routine",
      "targetDepartment": "Department name"
    }
  ],
  "riskAreas": [
    {
      "zoneName": "Name of area or specific street",
      "primaryThreat": "e.g., Road subsidence, disease outbreak, increased crime",
      "threatLevel": "high" | "medium" | "low"
    }
  ]
}
`;

  if (!model) {
    console.log("ℹ️ Gemini API not configured. Simulating predictive insights...");
    return simulatePredictiveInsights(area, issues);
  }

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonResult = JSON.parse(text);
    console.log("✅ Gemini successfully generated predictive insights.");
    return jsonResult;
  } catch (error) {
    console.error(`⚠️ Gemini API call failed (${error.message}). Falling back to simulation...`);
    return simulatePredictiveInsights(area, issues);
  }
};

/**
 * High-fidelity fallback simulated analysis if Gemini is unavailable
 */
function simulateIssueAnalysis(visionTags, locationAddress, existingIssues) {
  const tagsStr = visionTags.map(t => t.toLowerCase()).join(' ');
  let category = 'other';
  let title = 'Civic Issue';
  let recommendedAuthority = 'Local Municipal Corporation';
  let severity = 5;
  let urgencyLevel = 'medium';
  let estimatedResolutionDays = 7;

  if (tagsStr.includes('pothole') || tagsStr.includes('asphalt') || tagsStr.includes('road') || tagsStr.includes('pavement')) {
    category = 'pothole';
    title = 'Damaged Road and Active Pothole';
    recommendedAuthority = 'Municipal Corporation Road Maintenance Dept';
    severity = 7;
    urgencyLevel = 'high';
    estimatedResolutionDays = 5;
  } else if (tagsStr.includes('water') || tagsStr.includes('leak') || tagsStr.includes('puddle') || tagsStr.includes('pipe') || tagsStr.includes('drain')) {
    category = 'water leak';
    title = 'Water Pipeline Leakage';
    recommendedAuthority = 'Water Supply and Sewerage Board';
    severity = 8;
    urgencyLevel = 'critical';
    estimatedResolutionDays = 3;
  } else if (tagsStr.includes('light') || tagsStr.includes('lamp') || tagsStr.includes('lighting') || tagsStr.includes('dark')) {
    category = 'streetlight';
    title = 'Non-Functional Streetlight';
    recommendedAuthority = 'Electricity Board (Street Light Division)';
    severity = 4;
    urgencyLevel = 'low';
    estimatedResolutionDays = 4;
  } else if (tagsStr.includes('waste') || tagsStr.includes('trash') || tagsStr.includes('garbage') || tagsStr.includes('dump') || tagsStr.includes('litter')) {
    category = 'waste';
    title = 'Illegal Garbage Dumping on Street';
    recommendedAuthority = 'Sanitation & Solid Waste Management Dept';
    severity = 6;
    urgencyLevel = 'medium';
    estimatedResolutionDays = 3;
  }

  // Check for duplicates in existing issues (same category and similar address)
  let isDuplicate = false;
  const similarIssueIds = [];
  const locationSub = locationAddress.substring(0, 15).toLowerCase();

  for (const issue of existingIssues) {
    if (issue.category === category) {
      const issueAddr = (issue.location?.address || '').toLowerCase();
      if (issueAddr.includes(locationSub) || locationSub.includes(issueAddr.substring(0, 15).toLowerCase())) {
        isDuplicate = true;
        similarIssueIds.push(issue.id);
      } else {
        similarIssueIds.push(issue.id); // Add as similar if nearby and same category
      }
    }
  }

  const complaintLetter = `To,
The Executive Engineer,
${recommendedAuthority},
${locationAddress}

Subject: Urgent Complaint Regarding ${title} at ${locationAddress}

Respected Sir/Madam,

I am writing to bring to your attention a pressing civic issue: "${title}" located near ${locationAddress}. 

This issue represents a significant concern for residents in this area. Specifically, it has caused ${
    category === 'pothole' ? 'severe damage to vehicles and poses a major accident risk for two-wheelers.' :
    category === 'water leak' ? 'heavy water wastage and has begun washing away the underlying road foundation.' :
    category === 'streetlight' ? 'darkness at night, leading to an increase in security issues and pedestrian hazards.' :
    'unhygienic conditions and foul odors, attracting pests and posing a health hazard to families nearby.'
  }

We kindly request your department to inspect this site and arrange for the resolution of this issue on a priority basis. We estimate this should require approximately ${estimatedResolutionDays} days of standard repair work.

Thank you for your attention to this community matter.

Sincerely,
[Your Name]
[Contact Details]
Date: [Date]`;

  return {
    category,
    title,
    description: `Reported issue of category ${category} located at ${locationAddress}. Immediate inspection and remediation are requested.`,
    severity,
    urgencyLevel,
    estimatedResolutionDays,
    recommendedAuthority,
    isDuplicate,
    similarIssueIds: similarIssueIds.slice(0, 3),
    complaintLetter
  };
}

/**
 * Fallback simulated predictive insights
 */
function simulatePredictiveInsights(area, issues) {
  const issuesList = issues || [];
  const waterLeaks = issuesList.filter(i => i.category === 'water leak' && i.status !== 'Resolved').length;
  const potholes = issuesList.filter(i => i.category === 'pothole' && i.status !== 'Resolved').length;
  const streetlights = issuesList.filter(i => i.category === 'streetlight' && i.status !== 'Resolved').length;

  const predictions = [];
  const priorityActions = [];
  const riskAreas = [];

  if (waterLeaks > 0) {
    predictions.push({
      escalationRisk: 'high',
      summary: `Active water leak reports (${waterLeaks}) in ${area} risk softening the road sub-base. Left unaddressed, this will trigger asphalt collapse and form new severe potholes within 2 weeks.`,
      impactTimeframe: '2 weeks',
      linkedIssues: issuesList.filter(i => i.category === 'water leak').map(i => i.id).slice(0, 3)
    });
    priorityActions.push({
      action: 'Deploy emergency repair plumbers to patch major leakage points',
      urgency: 'immediate',
      targetDepartment: 'Water Supply and Sewerage Board'
    });
    riskAreas.push({
      zoneName: `${area} Water Mains`,
      primaryThreat: 'Road structural collapse due to soil erosion',
      threatLevel: 'high'
    });
  }

  if (potholes > 0) {
    predictions.push({
      escalationRisk: 'medium',
      summary: `Unrepaired potholes (${potholes}) will expand due to regular vehicular traffic. Monsoon or heavy rain cycles will accelerate expansion, leading to minor traffic jams and vehicle damage claims.`,
      impactTimeframe: '3 weeks',
      linkedIssues: issuesList.filter(i => i.category === 'pothole').map(i => i.id).slice(0, 3)
    });
    priorityActions.push({
      action: 'Fill active potholes with cold asphalt mix as a temporary measure',
      urgency: 'medium',
      targetDepartment: 'Municipal Road Maintenance Division'
    });
  }

  if (streetlights > 0) {
    predictions.push({
      escalationRisk: 'high',
      summary: `Dark zones created by unlit streetlights (${streetlights}) increase risk of vehicular accidents and personal safety hazards during late-evening hours.`,
      impactTimeframe: '1 week',
      linkedIssues: issuesList.filter(i => i.category === 'streetlight').map(i => i.id).slice(0, 3)
    });
    priorityActions.push({
      action: 'Initiate dark-zone audit and replace burnt-out sodium bulbs with LED fixtures',
      urgency: 'immediate',
      targetDepartment: 'Electrical Engineering Division'
    });
    riskAreas.push({
      zoneName: `${area} Junctions`,
      primaryThreat: 'Increase in nighttime collisions and street safety concerns',
      threatLevel: 'high'
    });
  }

  // Fallback defaults if list was empty
  if (predictions.length === 0) {
    predictions.push({
      escalationRisk: 'low',
      summary: 'No active major issues reported. Standard maintenance schedules are sufficient to preserve current infrastructure levels.',
      impactTimeframe: '1 month',
      linkedIssues: []
    });
    priorityActions.push({
      action: 'Continue routine municipal inspections and clean drainage channels',
      urgency: 'routine',
      targetDepartment: 'Public Works Department'
    });
    riskAreas.push({
      zoneName: area,
      primaryThreat: 'Routine wear and tear',
      threatLevel: 'low'
    });
  }

  return {
    predictions,
    priorityActions: priorityActions.slice(0, 3),
    riskAreas
  };
}
