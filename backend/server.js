// =============================================
// AWS Cost Optimization Engine - Backend Server
// Author: Student Project
// Description: Express server that fetches AWS cost data
//              and provides optimization suggestions
// =============================================

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import our custom modules
const awsDataFetcher = require('./awsData');
const costAnalyzer = require('./costAnalyzer');
const suggestionEngine = require('./suggestionEngine');

const app = express();
const PORT = 3000;

// Middleware setup
app.use(cors());                          // Allow frontend to call this API
app.use(express.json());                  // Parse JSON request bodies
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve frontend files

// =============================================
// ROUTE 1: Get dashboard summary
// Returns total cost + per-service breakdown
// =============================================
app.get('/api/dashboard', async (req, res) => {
    try {
        // Fetch all AWS cost data (real or mock)
        const rawData = await awsDataFetcher.getAllCosts();

        // Analyze the data to get totals and breakdowns
        const summary = costAnalyzer.getSummary(rawData);

        res.json({
            success: true,
            data: summary
        });
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// =============================================
// ROUTE 2: Get optimization suggestions
// Returns list of actionable recommendations
// =============================================
app.get('/api/suggestions', async (req, res) => {
    try {
        const rawData = await awsDataFetcher.getAllCosts();
        const suggestions = suggestionEngine.analyze(rawData);

        res.json({
            success: true,
            suggestions: suggestions
        });
    } catch (err) {
        console.error("Error generating suggestions:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// =============================================
// ROUTE 3: Get cost data for a specific service
// Example: /api/service?name=EC2
// =============================================
app.get('/api/service', async (req, res) => {
    try {
        const serviceName = req.query.name;

        if (!serviceName) {
            return res.status(400).json({ success: false, message: "Service name required" });
        }

        const rawData = await awsDataFetcher.getAllCosts();
        
        // Filter data for the requested service
        const serviceData = rawData.services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());

        if (!serviceData) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        res.json({ success: true, data: serviceData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// =============================================
// ROUTE 4: Cost alert check
// Returns alert if cost exceeds threshold
// =============================================
app.post('/api/alerts', (req, res) => {
    const { threshold } = req.body;

    if (!threshold || isNaN(threshold)) {
        return res.status(400).json({ success: false, message: "Invalid threshold value" });
    }

    // Get current mock total cost (in real app, fetch from AWS)
    const currentCost = 284.50; // This would come from awsDataFetcher in real app

    const isAlert = currentCost > parseFloat(threshold);

    res.json({
        success: true,
        alert: isAlert,
        currentCost: currentCost,
        threshold: parseFloat(threshold),
        message: isAlert
            ? `⚠️ Alert! Your AWS cost ($${currentCost}) exceeds your threshold ($${threshold})`
            : `✅ Cost is within limit. Current: $${currentCost}`
    });
});

// =============================================
// ROUTE 5: "Optimize Now" action
// Simulates applying a recommendation
// =============================================
app.post('/api/optimize', (req, res) => {
    const { action, resourceId } = req.body;

    // In a real app, this would call AWS SDK to stop/resize/modify resources
    // For this project, we simulate the action
    const actions = {
        'stop_instance': `EC2 instance ${resourceId} has been stopped. Estimated savings: $12/month`,
        'resize_instance': `EC2 instance ${resourceId} resized to t2.micro. Estimated savings: $25/month`,
        's3_lifecycle': `S3 lifecycle policy applied to ${resourceId}. Estimated savings: $8/month`,
        'delete_snapshot': `Snapshot ${resourceId} deleted. Estimated savings: $5/month`
    };

    const result = actions[action] || "Action completed successfully";

    res.json({
        success: true,
        message: result,
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n✅ AWS Cost Optimizer running at: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/index.html`);
    console.log(`🔌 API Base: http://localhost:${PORT}/api`);
    console.log(`\n⚠️  NOTE: Currently using MOCK data.`);
    console.log(`   To use real AWS data, add your credentials in backend/awsData.js\n`);
});
