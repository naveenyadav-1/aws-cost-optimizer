// =============================================
// awsData.js - AWS Data Fetcher
// =============================================
// This module handles fetching cost data from AWS.
// Currently uses MOCK data that looks realistic.
// 
// To connect with REAL AWS:
//   1. Install AWS SDK: npm install @aws-sdk/client-cost-explorer
//   2. Set your credentials (see comments below)
//   3. Uncomment the real AWS section and comment out mock data
// =============================================

// --- REAL AWS SDK SETUP (commented out, enable when ready) ---
// const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer");
//
// HOW TO SET AWS CREDENTIALS (choose one method):
// 
// Method 1: Environment variables (recommended for safety)
//   Set in terminal before running:
//   export AWS_ACCESS_KEY_ID=your_key_here
//   export AWS_SECRET_ACCESS_KEY=your_secret_here
//   export AWS_REGION=us-east-1
//
// Method 2: In code (NOT recommended - don't commit to GitHub!)
//   const client = new CostExplorerClient({
//       region: "us-east-1",
//       credentials: {
//           accessKeyId: "YOUR_ACCESS_KEY",
//           secretAccessKey: "YOUR_SECRET_KEY"
//       }
//   });

// =============================================
// MOCK DATA SECTION
// This simulates what AWS Cost Explorer returns
// The structure matches real AWS API responses
// =============================================

// Realistic mock AWS billing data
const mockAWSData = {
    // Billing period
    period: {
        start: "2024-12-01",
        end: "2024-12-31"
    },
    
    // Per-service cost breakdown
    services: [
        {
            name: "EC2",
            fullName: "Amazon EC2",
            cost: 112.40,
            unit: "USD",
            usage: "720 hours",
            instances: [
                { id: "i-0abc123", type: "t3.medium", state: "running", uptime: 720, monthlyCost: 30.40 },
                { id: "i-0def456", type: "t3.large",  state: "running", uptime: 720, monthlyCost: 58.00 },
                { id: "i-0ghi789", type: "t2.medium", state: "stopped", uptime: 0,   monthlyCost: 0 },
                { id: "i-0jkl012", type: "m5.xlarge", state: "running", uptime: 720, monthlyCost: 24.00 }
            ]
        },
        {
            name: "S3",
            fullName: "Amazon S3",
            cost: 45.20,
            unit: "USD",
            usage: "1.2 TB",
            buckets: [
                { name: "my-app-logs",     size: "450 GB", storageClass: "STANDARD",    cost: 10.35 },
                { name: "my-backups",      size: "600 GB", storageClass: "STANDARD",    cost: 13.80 },
                { name: "my-archive-data", size: "150 GB", storageClass: "STANDARD_IA", cost: 21.05 }
            ]
        },
        {
            name: "Lambda",
            fullName: "AWS Lambda",
            cost: 32.80,
            unit: "USD",
            usage: "2.1 Million requests",
            functions: [
                { name: "process-orders",    invocations: 850000,  avgDuration: 120, cost: 14.20 },
                { name: "send-emails",       invocations: 1200000, avgDuration: 80,  cost: 12.60 },
                { name: "cleanup-old-files", invocations: 50000,   avgDuration: 500, cost: 6.00 }
            ]
        },
        {
            name: "RDS",
            fullName: "Amazon RDS",
            cost: 58.60,
            unit: "USD",
            usage: "db.t3.medium",
            instances: [
                { id: "mydb-prod",  engine: "MySQL", type: "db.t3.medium", multiAZ: true,  cost: 45.80 },
                { id: "mydb-dev",   engine: "MySQL", type: "db.t2.micro",  multiAZ: false, cost: 12.80 }
            ]
        },
        {
            name: "CloudFront",
            fullName: "Amazon CloudFront",
            cost: 18.30,
            unit: "USD",
            usage: "500 GB transfer"
        },
        {
            name: "EBS",
            fullName: "Amazon EBS",
            cost: 17.20,
            unit: "USD",
            usage: "500 GB",
            volumes: [
                { id: "vol-001", size: 200, type: "gp2", attached: true,  cost: 10.00 },
                { id: "vol-002", size: 100, type: "gp2", attached: false, cost: 5.00 },  // unattached!
                { id: "vol-003", size: 200, type: "gp3", attached: true,  cost: 2.20 }
            ]
        }
    ],
    
    // Historical cost data (last 6 months, for trend chart)
    history: [
        { month: "Jul", cost: 210.50 },
        { month: "Aug", cost: 225.30 },
        { month: "Sep", cost: 198.70 },
        { month: "Oct", cost: 245.60 },
        { month: "Nov", cost: 260.10 },
        { month: "Dec", cost: 284.50 }
    ]
};


// =============================================
// REAL AWS COST EXPLORER FUNCTION (commented)
// Uncomment this to use actual AWS data
// =============================================
/*
async function getRealAWSCosts() {
    const client = new CostExplorerClient({ region: "us-east-1" });

    // Get last 30 days of data
    const today = new Date();
    const lastMonth = new Date(today.setDate(today.getDate() - 30));

    const command = new GetCostAndUsageCommand({
        TimePeriod: {
            Start: lastMonth.toISOString().split('T')[0],
            End: new Date().toISOString().split('T')[0]
        },
        Granularity: "MONTHLY",
        GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
        Metrics: ["BlendedCost"]
    });

    const response = await client.send(command);
    
    // Transform AWS response to our format
    const services = response.ResultsByTime[0].Groups.map(group => ({
        name: group.Keys[0].replace("Amazon ", "").replace("AWS ", ""),
        fullName: group.Keys[0],
        cost: parseFloat(group.Metrics.BlendedCost.Amount),
        unit: group.Metrics.BlendedCost.Unit
    }));

    return { services, period: response.ResultsByTime[0].TimePeriod };
}
*/


// =============================================
// MAIN EXPORTED FUNCTION
// This is what the server calls to get data
// =============================================
async function getAllCosts() {
    // In real project: return await getRealAWSCosts();
    
    // For now, return mock data (add small delay to simulate real API call)
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockAWSData), 300);
    });
}

module.exports = { getAllCosts };
