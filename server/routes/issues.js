import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, isSimulationMode } from '../config/firebase.js';
import { analyzeImageWithVision } from '../services/visionService.js';
import { analyzeIssue } from '../services/geminiService.js';
import admin from 'firebase-admin'; // for FieldValue if using production admin

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to save uploaded files locally in simulation mode
const saveFileLocally = (file) => {
  const uploadsDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const fileExt = path.extname(file.originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${fileExt}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${filename}`;
};

// Removed Firebase Storage helper

// Helper to award gamification points & badges to users
const updateUserPoints = async (userId, points, activity, userDetails = {}) => {
  if (!userId) return;
  try {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    let currentPoints = 0;
    let badges = [];
    let displayName = userDetails.displayName || "Citizen Hero";
    let photoURL = userDetails.photoURL || "";

    if (userSnap.exists) {
      const data = userSnap.data();
      currentPoints = data.points || 0;
      badges = data.badges || [];
      displayName = data.displayName || displayName;
      photoURL = data.photoURL || photoURL;
    }

    const newPoints = currentPoints + points;
    const newBadges = [...badges];

    // Badge logic
    if (activity === 'report' && !newBadges.includes('First Reporter')) {
      newBadges.push('First Reporter');
    }
    if (activity === 'verify' && !newBadges.includes('First Verification')) {
      newBadges.push('First Verification');
    }
    if (newPoints >= 50 && !newBadges.includes('Verified 10 Issues') && activity === 'verify') {
      newBadges.push('Verified 10 Issues'); // Awarded on hitting 50 points from verifications (approx 10 verifications)
    }
    if (newPoints >= 100 && !newBadges.includes('Local Legend')) {
      newBadges.push('Local Legend');
    }

    await userRef.set({
      uid: userId,
      displayName,
      photoURL,
      points: newPoints,
      badges: newBadges,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`🏆 Awarded ${points} points to user ${userId} for ${activity}. Total: ${newPoints}`);
  } catch (error) {
    console.error(`⚠️ Failed to update user points: ${error.message}`);
  }
};

/**
 * @route POST /api/issues
 * @desc Create a new issue (Upload image, run Vision + Gemini analysis, run duplicate check)
 */
router.post('/', async (req, res) => {
  try {
    const { imageUrl, address, latitude, longitude, userId, userName, userPhoto } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    if (!address || !latitude || !longitude) {
      return res.status(400).json({ error: 'Location information (address, lat, lng) is required' });
    }

    console.log(`📥 Received new issue report. Location: ${address}`);

    // Fetch the image buffer from Cloudinary URL so Vision API can process it
    console.log(`Fetching image from Cloudinary for Vision API analysis...`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image for analysis.');
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 2. Vision API analysis
    const visionTags = await analyzeImageWithVision(imageBuffer, 'cloudinary-upload.jpg');

    // 3. Get existing reports nearby (within ~2km) for duplicate check
    // In simulation mode or simple firestore, we fetch recent issues and compute distance
    const issuesSnap = await db.collection('issues').get();
    const existingIssues = [];
    issuesSnap.forEach(doc => {
      const issue = doc.data();
      if (issue.status !== 'Resolved') {
        existingIssues.push(issue);
      }
    });

    const lat1 = parseFloat(latitude);
    const lon1 = parseFloat(longitude);
    const nearbyIssues = existingIssues.filter(issue => {
      const lat2 = parseFloat(issue.location?.latitude);
      const lon2 = parseFloat(issue.location?.longitude);
      if (isNaN(lat2) || isNaN(lon2)) return false;
      
      // Haversine distance formula
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c;
      return d <= 2.0; // 2km radius
    });

    // 4. Gemini API analysis
    const aiAnalysis = await analyzeIssue(visionTags, address, nearbyIssues);

    // 5. Create final issue payload
    const newIssue = {
      title: aiAnalysis.title || 'Civic Issue',
      description: aiAnalysis.description || 'Reported civic issue',
      category: aiAnalysis.category || 'other',
      severity: Number(aiAnalysis.severity) || 5,
      urgencyLevel: aiAnalysis.urgencyLevel || 'medium',
      estimatedResolutionDays: Number(aiAnalysis.estimatedResolutionDays) || 7,
      recommendedAuthority: aiAnalysis.recommendedAuthority || 'Local Municipal Authority',
      complaintLetter: aiAnalysis.complaintLetter || '',
      isDuplicate: aiAnalysis.isDuplicate || false,
      similarIssues: (aiAnalysis.similarIssueIds || []).filter(Boolean),
      location: {
        address,
        latitude: lat1,
        longitude: lon1,
        country: req.body.country || '',
        city: req.body.city || ''
      },
      imageUrl,
      visionTags: (visionTags || []).filter(Boolean),
      status: 'Reported',
      upvotes: 0,
      upvotedBy: [],
      verifications: 0,
      verifiedBy: [],
      commentsCount: 0,
      reporter: {
        uid: userId || 'anonymous',
        displayName: userName || 'Anonymous Citizen',
        photoURL: userPhoto || ''
      },
      history: [
        {
          status: 'Reported',
          timestamp: new Date().toISOString(),
          note: 'Issue reported by citizen.'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('issues').add(newIssue);
    newIssue.id = docRef.id;

    // Save ID back inside the document
    await db.collection('issues').doc(docRef.id).update({ id: docRef.id });

    // 6. Award Gamification Points for Reporting
    if (userId) {
      await updateUserPoints(userId, 10, 'report', { displayName: userName, photoURL: userPhoto });
    }

    res.status(201).json(newIssue);
  } catch (error) {
    console.error(`🔴 Error creating issue: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/issues/nearby
 * @desc Get all issues sorted by proximity to provided lat/lng coordinates
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude (lat) and longitude (lng) are required' });
    }

    const lat1 = parseFloat(lat);
    const lon1 = parseFloat(lng);
    const radKm = parseFloat(radius);

    if (isNaN(lat1) || isNaN(lon1)) {
      return res.status(400).json({ error: 'Invalid coordinate parameters' });
    }

    // Fetch all issues from DB
    const issuesSnap = await db.collection('issues').get();
    const list = [];
    issuesSnap.forEach(doc => {
      list.push(doc.data());
    });

    const R = 6371; // Earth radius in km
    const matched = [];

    list.forEach(issue => {
      const lat2 = parseFloat(issue.location?.latitude);
      const lon2 = parseFloat(issue.location?.longitude);
      if (isNaN(lat2) || isNaN(lon2)) return;

      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      if (distance <= radKm) {
        matched.push({
          ...issue,
          distanceKm: Number(distance.toFixed(2))
        });
      }
    });

    // Sort closest first
    matched.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ issues: matched });
  } catch (error) {
    console.error(`🔴 Error fetching nearby issues: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});


/**
 * @route GET /api/issues
 * @desc Get all issues with filters, search, and pagination
 */
router.get('/', async (req, res) => {
  try {
    const { category, severity, status, search, reporterId, page = 1, limit = 10 } = req.query;

    console.log("🔍 Fetching issues with filters:", { category, severity, status, search, reporterId });

    let query = db.collection('issues');
    
    // Fetch all since we might need local filtering for search and parsing values, 
    // or apply basic filters if possible. Since Firebase queries are strict, local filtering is 
    // extremely safe and resilient.
    const snapshot = await query.get();
    let issues = [];
    
    snapshot.forEach(doc => {
      issues.push(doc.data());
    });

    // Apply category filter
    if (category && category !== 'all') {
      issues = issues.filter(i => i.category?.toLowerCase() === category.toLowerCase());
    }

    // Apply status filter
    if (status && status !== 'all') {
      issues = issues.filter(i => i.status?.toLowerCase() === status.toLowerCase());
    }

    // Apply severity filter (e.g. critical, moderate, minor)
    if (severity && severity !== 'all') {
      issues = issues.filter(i => {
        const sev = Number(i.severity) || 1;
        if (severity === 'critical') return sev >= 8;
        if (severity === 'moderate') return sev >= 4 && sev <= 7;
        if (severity === 'minor') return sev <= 3;
        return true;
      });
    }

    // Apply reporterId filter ("My Reports")
    if (reporterId) {
      issues = issues.filter(i => i.reporter?.uid === reporterId);
    }

    // Apply text search on title, description, address, or category
    if (search) {
      const searchLower = search.toLowerCase();
      issues = issues.filter(i => 
        (i.title || '').toLowerCase().includes(searchLower) ||
        (i.description || '').toLowerCase().includes(searchLower) ||
        (i.location?.address || '').toLowerCase().includes(searchLower) ||
        (i.category || '').toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdAt descending by default
    issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const total = issues.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedIssues = issues.slice(startIndex, startIndex + limitNum);

    res.json({
      issues: paginatedIssues,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error(`🔴 Error fetching issues: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/issues/:id
 * @desc Get details of a single issue
 */
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('issues').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Fetch comments
    const commentsSnap = await db.collection('comments')
      .where('issueId', '==', req.params.id)
      .get();
      
    const comments = [];
    commentsSnap.forEach(d => {
      comments.push(d.data());
    });
    comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({
      ...doc.data(),
      comments
    });
  } catch (error) {
    console.error(`🔴 Error fetching issue detail: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/issues/:id/comments
 * @desc File a comment under an issue
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { userId, userName, userPhoto, text } = req.body;
    const issueId = req.params.id;

    if (!userId || !text) {
      return res.status(400).json({ error: 'User ID and comment text are required' });
    }

    const newComment = {
      id: `${issueId}-comment-${Date.now()}`,
      issueId,
      userId,
      userName: userName || 'Citizen Hero',
      userPhoto: userPhoto || '',
      text,
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    await db.collection('comments').doc(newComment.id).set(newComment);

    // Update issue document's updatedAt timestamp
    await db.collection('issues').doc(issueId).update({
      updatedAt: new Date().toISOString()
    });

    // Award Gamification Points for commenting (+2 XP)
    await updateUserPoints(userId, 2, 'comment', { displayName: userName, photoURL: userPhoto });

    res.status(201).json(newComment);
  } catch (error) {
    console.error(`🔴 Error posting comment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});


/**
 * @route PATCH /api/issues/:id
 * @desc Update issue status or handle upvotes & verifications (Gamified actions)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { status, note, userId, userName, userPhoto, action } = req.body;
    const issueRef = db.collection('issues').doc(req.params.id);
    const issueSnap = await issueRef.get();

    if (!issueSnap.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const issueData = issueSnap.data();

    // 1. Upvote Action
    if (action === 'upvote') {
      if (!userId) return res.status(400).json({ error: 'User ID required to upvote' });
      
      let upvotedBy = issueData.upvotedBy || [];
      let upvotes = issueData.upvotes || 0;
      
      const userIdx = upvotedBy.indexOf(userId);
      if (userIdx >= 0) {
        // Remove upvote
        upvotedBy.splice(userIdx, 1);
        upvotes = Math.max(0, upvotes - 1);
      } else {
        // Add upvote
        upvotedBy.push(userId);
        upvotes += 1;
      }

      await issueRef.update({ upvotes, upvotedBy, updatedAt: new Date().toISOString() });
      return res.json({ id: req.params.id, upvotes, upvotedBy });
    }

    // 2. Verification Action
    if (action === 'verify') {
      if (!userId) return res.status(400).json({ error: 'User ID required to verify' });
      if (issueData.reporter?.uid === userId) {
        return res.status(400).json({ error: 'You cannot verify your own reported issue!' });
      }

      let verifiedBy = issueData.verifiedBy || [];
      let verifications = issueData.verifications || 0;
      let newStatus = issueData.status;

      const userIdx = verifiedBy.indexOf(userId);
      if (userIdx >= 0) {
        return res.status(400).json({ error: 'You have already verified this issue' });
      }

      verifiedBy.push(userId);
      verifications += 1;

      // Auto-validate status progression
      // If an issue gets 3 verifications, and its status is 'Reported', promote to 'Verified'
      const history = issueData.history || [];
      if (verifications >= 3 && newStatus === 'Reported') {
        newStatus = 'Verified';
        history.push({
          status: 'Verified',
          timestamp: new Date().toISOString(),
          note: 'Community verification threshold met (3+ verifications).'
        });
      }

      await issueRef.update({ 
        verifications, 
        verifiedBy, 
        status: newStatus,
        history,
        updatedAt: new Date().toISOString() 
      });

      // Award Points for verifying (5 points)
      await updateUserPoints(userId, 5, 'verify', { displayName: userName, photoURL: userPhoto });

      return res.json({ id: req.params.id, verifications, verifiedBy, status: newStatus });
    }

    // 3. Status Progression Update (Authorities / Admins)
    if (status) {
      const history = issueData.history || [];
      history.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `Status updated to ${status}.`
      });

      await issueRef.update({
        status,
        history,
        updatedAt: new Date().toISOString()
      });

      // If status is updated to Resolved, award 50 points to the original reporter!
      if (status === 'Resolved' && issueData.reporter?.uid && issueData.reporter.uid !== 'anonymous') {
        console.log(`🎉 Issue resolved. Rewarding reporter ${issueData.reporter.uid} with 50 points!`);
        await updateUserPoints(issueData.reporter.uid, 50, 'resolved_bonus');
      }

      return res.json({ id: req.params.id, status, history });
    }

    res.status(400).json({ error: 'No valid update action provided' });
  } catch (error) {
    console.error(`🔴 Error updating issue: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/issues/:id/comments
 * @desc Add a comment to an issue (Gamified: 2 points awarded)
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { userId, userName, userPhoto, text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const issueRef = db.collection('issues').doc(req.params.id);
    const issueSnap = await issueRef.get();

    if (!issueSnap.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const newComment = {
      issueId: req.params.id,
      userId: userId || 'anonymous',
      userName: userName || 'Anonymous Citizen',
      userPhoto: userPhoto || '',
      text,
      createdAt: new Date().toISOString()
    };

    const commentRef = await db.collection('comments').add(newComment);
    newComment.id = commentRef.id;

    // Save ID back inside the document
    await db.collection('comments').doc(commentRef.id).update({ id: commentRef.id });

    // Update comment counter in the parent issue
    const currentCommentsCount = issueSnap.data().commentsCount || 0;
    await issueRef.update({ 
      commentsCount: currentCommentsCount + 1,
      updatedAt: new Date().toISOString() 
    });

    // Award Points for Commenting (2 points)
    if (userId) {
      await updateUserPoints(userId, 2, 'comment', { displayName: userName, photoURL: userPhoto });
    }

    res.status(201).json(newComment);
  } catch (error) {
    console.error(`🔴 Error posting comment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/issues/sim-user
 * @desc Register user profile inside the database in simulation/mock mode
 */
router.post('/sim-user', async (req, res) => {
  try {
    const { uid, displayName, photoURL, username } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID is required' });
    
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    
    let existingData = {};
    if (snap.exists) {
      existingData = snap.data();
    }
    
    await userRef.set({
      uid,
      displayName: displayName || existingData.displayName || 'Citizen Hero',
      username: username || existingData.username || 'hero',
      photoURL: photoURL || existingData.photoURL || '',
      points: existingData.points || 0,
      badges: existingData.badges || [],
      createdAt: existingData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
