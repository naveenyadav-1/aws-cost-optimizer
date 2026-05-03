 require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

const services = [
  { name: "EC2", fullName: "Amazon EC2", cost: 120.00, usage: "720 hours", percentage: 50 },
  { name: "S3", fullName: "Amazon S3", cost: 40.00, usage: "1.2 TB", percentage: 17 },
  { name: "RDS", fullName: "Amazon RDS", cost: 60.00, usage: "db.t3.medium", percentage: 25 },
  { name: "Lambda", fullName: "AWS Lambda", cost: 20.00, usage: "2.1M requests", percentage: 8 }
];

const history = [
  { month: "Nov", cost: 210.50 }, { month: "Dec", cost: 225.30 },
  { month: "Jan", cost: 198.70 }, { month: "Feb", cost: 245.60 },
  { month: "Mar", cost: 260.10 }, { month: "Apr", cost: 240.00 }
];

const suggestions = [
  { title: "Stop idle EC2 instances", detail: "2 EC2 instances have been idle for 7+ days.", type: "EC2", severity: "high", savings: 48.00, icon: "🔴", action: "stop-ec2", resourceId: "i-0abc123" },
  { title: "Move S3 logs to Glacier", detail: "Old log files can be moved to Glacier storage class.", type: "S3", severity: "medium", savings: 12.00, icon: "🟡", action: "s3-glacier", resourceId: "my-app-logs" },
  { title: "Resize RDS to smaller instance", detail: "RDS CPU usage is below 10%.", type: "RDS", severity: "medium", savings: 15.00, icon: "🟡", action: "resize-rds", resourceId: "mydb-dev" }
];

async function startServer() {
  await connectDB();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../frontend')));

  // Public routes
  app.use('/api/auth', authRoutes);

  // Protected routes
  app.get('/api/dashboard', authMiddleware, (req, res) => {
    const totalCost = services.reduce((sum, s) => sum + s.cost, 0);
    const topService = services.reduce((prev, curr) => curr.cost > prev.cost ? curr : prev);
    res.json({
      success: true,
      data: {
        totalCost,
        changePercent: 5.2,
        topService,
        services,
        history,
        period: { start: "2025-03-21", end: "2025-04-21" },
        stats: { totalServices: services.length }
      },
      estimatedSavings: totalCost * 0.3
    });
  });

  app.get('/api/suggestions', authMiddleware, (req, res) => {
    res.json({ success: true, suggestions });
  });

  app.post('/api/alerts', authMiddleware, (req, res) => {
    const { threshold } = req.body;
    if (!threshold || isNaN(threshold)) {
      return res.status(400).json({ success: false, message: "Invalid threshold" });
    }
    const totalCost = services.reduce((sum, s) => sum + s.cost, 0);
    const isAlert = totalCost > threshold;
    res.json({
      success: true,
      alert: isAlert,
      currentCost: totalCost,
      threshold,
      message: isAlert
        ? `⚠ High cost! Current: $${totalCost} exceeds $${threshold}`
        : `✅ Cost is under control. Current: $${totalCost}`
    });
  });

  app.post('/api/optimize', authMiddleware, (req, res) => {
    const { action, resourceId } = req.body;
    res.json({
      success: true,
      message: `Action "${action}" applied on "${resourceId}". Changes simulated successfully!`
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer();