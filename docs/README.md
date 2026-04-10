# AWS Cost Optimization Engine
## College Mini Project — Setup & Documentation Guide

---

## 📁 Project Folder Structure

```
aws-cost-optimizer/
│
├── package.json               ← Node.js project config
│
├── backend/
│   ├── server.js              ← Express server (main entry point)
│   ├── awsData.js             ← AWS data fetcher (mock + real SDK)
│   ├── costAnalyzer.js        ← Cost analysis logic
│   └── suggestionEngine.js    ← Optimization recommendation logic
│
├── frontend/
│   ├── index.html             ← Main dashboard page
│   ├── css/
│   │   └── style.css          ← All styles
│   └── js/
│       └── app.js             ← Frontend JavaScript
│
└── docs/
    └── README.md              ← This file
```

---

## 🚀 Step-by-Step Setup (Beginner Friendly)

### Step 1: Install Node.js
- Go to https://nodejs.org
- Download the **LTS version** (e.g., 18.x or 20.x)
- Install it like any normal software
- Verify: open terminal and type `node --version`

### Step 2: Download/Clone the Project
```bash
# If using Git:
git clone <your-repo-url>
cd aws-cost-optimizer

# OR just copy the project folder manually
```

### Step 3: Install Dependencies
```bash
# Open terminal in the project root folder
npm install
```
This installs:
- `express` — web server
- `cors` — allows frontend to talk to backend

### Step 4: Run the Project
```bash
npm start
```
You should see:
```
✅ AWS Cost Optimizer running at: http://localhost:3000
📊 Dashboard: http://localhost:3000/index.html
```

### Step 5: Open the Dashboard
Open your browser and go to:
```
http://localhost:3000/index.html
```

**That's it! The project runs on mock data by default.**

---

## 🔌 How to Connect with Real AWS (Optional)

### Step 1: Install AWS SDK
```bash
npm install @aws-sdk/client-cost-explorer
```

### Step 2: Get AWS Credentials
1. Log in to AWS Console → IAM
2. Create a user with `ReadOnlyAccess` or `CostExplorerReadOnlyAccess` policy
3. Generate Access Key ID and Secret Access Key

### Step 3: Set Credentials (Recommended Method)
```bash
# On Mac/Linux terminal:
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_REGION=us-east-1

# On Windows Command Prompt:
set AWS_ACCESS_KEY_ID=your_access_key_here
set AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### Step 4: Enable Real AWS in Code
In `backend/awsData.js`:
1. Uncomment the AWS SDK import at the top
2. Uncomment the `getRealAWSCosts()` function
3. Change the `getAllCosts()` function to call the real function

**⚠️ IMPORTANT SECURITY NOTE:** Never commit your AWS credentials to GitHub!
Always use environment variables or AWS credential files.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full cost summary + service breakdown |
| GET | `/api/suggestions` | All optimization recommendations |
| GET | `/api/service?name=EC2` | Data for a specific service |
| POST | `/api/alerts` | Check if cost exceeds budget |
| POST | `/api/optimize` | Apply an optimization action |

---

## 🎯 Key Features Explained

### 1. Dashboard Summary Cards
Shows total monthly cost, highest-cost service, number of active services, and count of optimization suggestions.

### 2. Cost Breakdown Table
Lists each AWS service with its cost, percentage of total bill, usage stats, and a severity badge.

### 3. Service Cost Doughnut Chart
Visual pie-style chart showing which services are eating the most money. Has a filter dropdown to zoom in on one service.

### 4. 6-Month Trend Line Chart
Shows how your AWS bill has changed over the past 6 months. Useful for spotting cost spikes.

### 5. Optimization Suggestions
The core feature. The Suggestion Engine analyzes usage patterns and flags:
- Stopped EC2 instances (still paying for EBS)
- Over-provisioned instances (too big for usage)
- S3 buckets using expensive storage classes
- Unattached EBS volumes (wasted money)
- Development databases with unnecessary Multi-AZ
- Lambda functions with high execution time

### 6. Cost Alert System
Enter a monthly budget. Click "Check Alert". The system tells you if you're over budget.

### 7. Optimize Now Button
Opens a confirmation modal. In demo mode, simulates applying the optimization and shows estimated savings.

### 8. Filter by Service
Use the dropdown on the chart, or the severity filter buttons (High/Medium/Low) on suggestions.

---

## 💡 How the Suggestion Engine Works

```
Raw AWS Data (from awsData.js)
        ↓
suggestionEngine.analyze()
        ↓
  ┌─────────────────────────────────┐
  │ checkEC2()  → Stopped/Oversized │
  │ checkS3()   → Wrong storage class│
  │ checkEBS()  → Unattached volumes │
  │ checkRDS()  → Unnecessary Multi-AZ│
  │ checkLambda()→ High duration fns │
  └─────────────────────────────────┘
        ↓
Sorted suggestions (High → Medium → Low)
        ↓
Sent to frontend as JSON
```

---

## 📝 Viva Questions & Answers

**Q1: What is the purpose of this project?**
A: This project helps AWS users monitor and reduce their cloud spending. It fetches billing data, displays service-wise cost breakdown, and provides actionable recommendations to eliminate wasteful spending.

**Q2: What tech stack did you use?**
A: Frontend: HTML, CSS, JavaScript, Chart.js. Backend: Node.js with Express framework. AWS integration: AWS SDK for JavaScript (v3). For the demo, we use mock data that mirrors real AWS API responses.

**Q3: How does the suggestion engine work?**
A: The suggestion engine in `suggestionEngine.js` analyzes AWS resource data. It checks for stopped EC2 instances, over-provisioned servers, S3 buckets using the wrong storage class, unattached EBS volumes, and unnecessary configurations. Each check produces a recommendation with severity, description, and estimated savings.

**Q4: What is AWS Cost Explorer?**
A: AWS Cost Explorer is an AWS service that provides detailed reports on your AWS spending. Our project uses the `GetCostAndUsage` API call from the Cost Explorer SDK to fetch billing data. In the demo, we simulate this with realistic mock data.

**Q5: How would you secure the AWS credentials?**
A: We use environment variables to store AWS credentials, never hardcoding them in source code. For production, we'd use AWS IAM Roles instead of access keys. We also use the principle of least privilege — only read-only permissions are needed.

**Q6: What is the difference between gp2 and gp3 EBS volumes?**
A: gp3 is the newer EBS volume type. It's 20% cheaper than gp2 and allows you to configure performance independently of storage size. Migrating from gp2 to gp3 is free, takes minutes, and causes zero downtime.

**Q7: What are Reserved Instances?**
A: Reserved Instances are a pricing model where you commit to using an EC2 instance for 1 or 3 years in exchange for up to 72% discount compared to On-Demand pricing. Our system suggests this for instances running 24/7.

**Q8: What is S3 Intelligent-Tiering?**
A: S3 Intelligent-Tiering automatically moves objects between access tiers based on access patterns. Objects not accessed for 30 days move to a cheaper tier. It's ideal for data with unpredictable access patterns.

**Q9: How does CORS work in your project?**
A: CORS (Cross-Origin Resource Sharing) is enabled on the backend using the `cors` npm package. Without it, the browser would block the frontend JavaScript from calling our API because they're on different ports (3000 for server, opened from file for frontend).

**Q10: What would you improve if given more time?**
A: I would add real AWS authentication with proper IAM, implement a database (MongoDB) to store historical cost data, add email alerts using AWS SES, build a login system for multiple AWS accounts, and add CI/CD pipeline monitoring costs.

---

## 🏆 Bonus Features Implemented

- ✅ Cost Alert System (set budget, get warned if exceeded)
- ✅ Filter by Service (dropdown + severity buttons)
- ✅ "Optimize Now" button with confirmation modal
- ✅ Dismiss individual suggestions
- ✅ Month-over-month cost change indicator
- ✅ Responsive design (works on mobile)
- ✅ Refresh button to reload data

---

## ⚙️ Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Page structure |
| CSS3 | Styling and layout |
| JavaScript (ES6+) | Frontend logic, API calls |
| Node.js | Backend runtime |
| Express.js | Web server and API routing |
| Chart.js | Interactive charts (CDN) |
| AWS SDK v3 | AWS API integration (optional) |
| npm | Package management |

---

*Project by: [Your Name] | [Your College] | [Year]*
