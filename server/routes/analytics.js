import express from 'express';
import { db } from '../config/firebase.js';
import { generatePredictiveInsights } from '../services/geminiService.js';

const router = express.Router();

/**
 * @route GET /api/analytics/dashboard
 * @desc Get aggregated stats for the dashboard + user leaderboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const issuesSnap = await db.collection('issues').get();
    const usersSnap = await db.collection('users').get();

    const issues = [];
    issuesSnap.forEach(doc => {
      issues.push(doc.data());
    });

    const users = [];
    usersSnap.forEach(doc => {
      users.push(doc.data());
    });

    // 1. Calculate General Counters
    const total = issues.length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    const inProgress = issues.filter(i => i.status === 'In Progress').length;
    const verified = issues.filter(i => i.status === 'Verified').length;
    const reported = issues.filter(i => i.status === 'Reported').length;
    const pending = total - resolved;

    // 2. Count by Category
    const categoryCounts = {
      pothole: 0,
      'water leak': 0,
      streetlight: 0,
      waste: 0,
      other: 0
    };

    issues.forEach(i => {
      const cat = (i.category || 'other').toLowerCase();
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      } else {
        categoryCounts['other']++;
      }
    });

    // 3. Calculate Average Resolution Time (in days)
    let totalResolutionDays = 0;
    let resolvedCount = 0;

    issues.forEach(issue => {
      if (issue.status === 'Resolved') {
        const reportTime = new Date(issue.createdAt);
        // Find Resolved entry in history
        const resolvedEvent = (issue.history || []).find(h => h.status === 'Resolved');
        if (resolvedEvent) {
          const resolveTime = new Date(resolvedEvent.timestamp);
          const diffMs = resolveTime - reportTime;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          totalResolutionDays += Math.max(0.1, diffDays); // Minimum 0.1 days to avoid 0s
          resolvedCount++;
        }
      }
    });

    const avgResolutionTimeDays = resolvedCount > 0 ? (totalResolutionDays / resolvedCount).toFixed(1) : '5.2';

    // 4. Calculate Top Areas
    const areaCounts = {};
    issues.forEach(issue => {
      const addr = issue.location?.address || '';
      // Extract a general street/neighborhood name (first 2 segments of address)
      const parts = addr.split(',');
      const areaKey = parts.slice(0, 2).map(p => p.trim()).join(', ') || 'Unknown Area';
      areaCounts[areaKey] = (areaCounts[areaKey] || 0) + 1;
    });

    const topAreas = Object.keys(areaCounts)
      .map(name => ({ name, count: areaCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Generate Leaderboard (Top users sorted by points)
    const leaderboard = users
      .map(u => ({
        uid: u.uid,
        displayName: u.displayName || 'Citizen Hero',
        photoURL: u.photoURL || '',
        points: u.points || 0,
        badges: u.badges || []
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 8);

    // 6. Calculate total citizens helped (approximation based on upvotes/comments + resolved issues)
    const totalUpvotes = issues.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);
    const citizensHelped = (resolved * 15) + totalUpvotes + users.length;

    res.json({
      summary: {
        total,
        resolved,
        inProgress,
        verified,
        reported,
        pending,
        citizensHelped,
        neighborhoodsCovered: Object.keys(areaCounts).length
      },
      categoryStats: Object.keys(categoryCounts).map(name => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: categoryCounts[name]
      })),
      avgResolutionTime: `${avgResolutionTimeDays} days`,
      topAreas,
      leaderboard
    });
  } catch (error) {
    console.error(`🔴 Error compiling analytics dashboard: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/analytics/predictive-insights
 * @desc Get Gemini AI predictions for escalating risks in an area
 */
router.get('/predictive-insights', async (req, res) => {
  try {
    const { area = 'Metro Area' } = req.query;

    // Fetch all active issues in the past 30 days
    const issuesSnap = await db.collection('issues').get();
    const issues = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    issuesSnap.forEach(doc => {
      const data = doc.data();
      const createdDate = new Date(data.createdAt);
      if (createdDate >= thirtyDaysAgo) {
        issues.push(data);
      }
    });

    const insights = await generatePredictiveInsights(area, issues);
    res.json(insights);
  } catch (error) {
    console.error(`🔴 Error getting predictive insights: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
