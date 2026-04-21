// AWS se cost data laane ka code
// Naveen Yadav - AWS Cost Optimizer Project

const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer");

// AWS se connect karo - keys environment se aayengi
var client = new CostExplorerClient({
    region: "us-east-1"
});

// aaj ki date aur 30 din pehle ki date nikalo
function getDateRange() {
    var today = new Date();
    var lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    // AWS ko YYYY-MM-DD format chahiye
    var startDate = lastMonth.toISOString().split('T')[0];
    var endDate = today.toISOString().split('T')[0];

    return { start: startDate, end: endDate };
}

// real AWS data fetch karo
async function getRealData() {
    var dates = getDateRange();

    var command = new GetCostAndUsageCommand({
        TimePeriod: {
            Start: dates.start,
            End: dates.end
        },
        Granularity: "MONTHLY",
        GroupBy: [
            { Type: "DIMENSION", Key: "SERVICE" }
        ],
        Metrics: ["BlendedCost"]
    });

    try {
        var result = await client.send(command);
        var groups = result.ResultsByTime[0].Groups;

        // AWS ka response apne format mein convert karo
        var services = [];
        for (var i = 0; i < groups.length; i++) {
            var g = groups[i];
            var cost = parseFloat(g.Metrics.BlendedCost.Amount);

            // zero cost wali services skip karo
            if (cost <= 0) continue;

            services.push({
                name: g.Keys[0].replace("Amazon ", "").replace("AWS ", ""),
                fullName: g.Keys[0],
                cost: cost,
                unit: g.Metrics.BlendedCost.Unit,
                usage: "AWS Console dekho"
            });
        }

        // naya account hai toh data nahi hoga
        if (services.length === 0) {
            console.log("Abhi koi cost data nahi hai - mock data use ho raha hai");
            return getMockData();
        }

        return {
            period: dates,
            services: services,
            history: getMockHistory()
        };

    } catch (err) {
        // koi error aaya toh mock data use karo
        console.log("AWS error aaya, mock data use ho raha hai:", err.message);
        return getMockData();
    }
}

// mock data - jab real data na mile
function getMockData() {
    return {
        period: { start: "2024-12-01", end: "2024-12-31" },
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
                    { name: "my-app-logs",  size: "450 GB", storageClass: "STANDARD", cost: 10.35 },
                    { name: "my-backups",   size: "600 GB", storageClass: "STANDARD", cost: 13.80 }
                ]
            },
            {
                name: "Lambda",
                fullName: "AWS Lambda",
                cost: 32.80,
                unit: "USD",
                usage: "2.1M requests",
                functions: [
                    { name: "process-orders",    invocations: 850000, avgDuration: 120, cost: 14.20 },
                    { name: "cleanup-old-files",  invocations: 50000,  avgDuration: 500, cost: 6.00 }
                ]
            },
            {
                name: "RDS",
                fullName: "Amazon RDS",
                cost: 58.60,
                unit: "USD",
                usage: "db.t3.medium",
                instances: [
                    { id: "mydb-prod", engine: "MySQL", type: "db.t3.medium", multiAZ: true,  cost: 45.80 },
                    { id: "mydb-dev",  engine: "MySQL", type: "db.t2.micro",  multiAZ: false, cost: 12.80 }
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
                    { id: "vol-002", size: 100, type: "gp2", attached: false, cost: 5.00  },
                    { id: "vol-003", size: 200, type: "gp3", attached: true,  cost: 2.20  }
                ]
            }
        ],
        history: getMockHistory()
    };
}

// pichle 6 mahine ka data
function getMockHistory() {
    return [
        { month: "Jul", cost: 210.50 },
        { month: "Aug", cost: 225.30 },
        { month: "Sep", cost: 198.70 },
        { month: "Oct", cost: 245.60 },
        { month: "Nov", cost: 260.10 },
        { month: "Dec", cost: 284.50 }
    ];
}

// yahi function server.js call karta hai
async function getAllCosts() {
    return await getRealData();
}

module.exports = { getAllCosts };