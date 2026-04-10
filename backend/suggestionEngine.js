// =============================================
// suggestionEngine.js - Cost Optimization Logic
// =============================================
// This is the "brain" of the project.
// It looks at AWS usage data and finds:
//   - Idle/unused resources
//   - Over-provisioned services
//   - Storage optimization opportunities
//   - Cost-saving recommendations
//
// Each suggestion has:
//   - type: category of issue
//   - severity: high / medium / low
//   - title: short description
//   - detail: full explanation in simple English
//   - savings: estimated monthly savings
//   - action: what action to take (used by Optimize Now button)
//   - resourceId: which specific resource to fix
// =============================================

function analyze(rawData) {
    const suggestions = [];
    const { services } = rawData;

    // Go through each service and check for issues
    for (let i = 0; i < services.length; i++) {
        const service = services[i];

        if (service.name === "EC2") {
            checkEC2(service, suggestions);
        }

        if (service.name === "S3") {
            checkS3(service, suggestions);
        }

        if (service.name === "EBS") {
            checkEBS(service, suggestions);
        }

        if (service.name === "RDS") {
            checkRDS(service, suggestions);
        }

        if (service.name === "Lambda") {
            checkLambda(service, suggestions);
        }
    }

    // Sort by severity: high first, then medium, then low
    const order = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => order[a.severity] - order[b.severity]);

    return suggestions;
}


// =============================================
// EC2 - Check for unused or oversized instances
// =============================================
function checkEC2(ec2Service, suggestions) {
    if (!ec2Service.instances) return;

    for (let i = 0; i < ec2Service.instances.length; i++) {
        const instance = ec2Service.instances[i];

        // Check 1: Instance is stopped but still exists (you pay for EBS even when stopped)
        if (instance.state === "stopped") {
            suggestions.push({
                type: "EC2",
                severity: "high",
                title: "Stopped EC2 Instance Detected",
                detail: `Instance ${instance.id} (${instance.type}) has been stopped. 
                         You are still paying for the attached EBS storage. 
                         If this instance is no longer needed, consider terminating it 
                         to stop all charges completely.`,
                savings: 15.00,
                action: "stop_instance",
                resourceId: instance.id,
                icon: "🔴"
            });
        }

        // Check 2: Large instance that might be over-provisioned
        // In real app, you'd check CloudWatch CPU metrics
        if (instance.type === "m5.xlarge" || instance.type === "t3.large") {
            suggestions.push({
                type: "EC2",
                severity: "medium",
                title: "Possibly Over-Provisioned EC2 Instance",
                detail: `Instance ${instance.id} is running on ${instance.type}. 
                         Based on typical usage patterns for small applications, 
                         this might be over-provisioned. Consider checking CPU/memory 
                         usage in CloudWatch. If usage is below 20%, downsize to a 
                         smaller instance type to save money.`,
                savings: 25.00,
                action: "resize_instance",
                resourceId: instance.id,
                icon: "🟡"
            });
        }
    }

    // Check 3: Suggest Reserved Instances if running 24/7
    const alwaysOnInstances = ec2Service.instances.filter(i => i.uptime >= 700);
    if (alwaysOnInstances.length >= 2) {
        suggestions.push({
            type: "EC2",
            severity: "medium",
            title: "Consider Reserved Instances for Long-Running Servers",
            detail: `You have ${alwaysOnInstances.length} EC2 instances running 24/7 this month. 
                     Switching from On-Demand to Reserved Instances (1-year term) 
                     can save up to 40% on EC2 costs. This is ideal for production 
                     servers that run all the time.`,
            savings: 45.00,
            action: "reserved_instance",
            resourceId: "all",
            icon: "💡"
        });
    }
}


// =============================================
// S3 - Check for storage class optimization
// =============================================
function checkS3(s3Service, suggestions) {
    if (!s3Service.buckets) return;

    for (let i = 0; i < s3Service.buckets.length; i++) {
        const bucket = s3Service.buckets[i];

        // Check: Logs bucket using STANDARD class (should use GLACIER or IA)
        if (bucket.name.includes("log") && bucket.storageClass === "STANDARD") {
            suggestions.push({
                type: "S3",
                severity: "high",
                title: "Log Bucket Using Expensive Storage Class",
                detail: `Bucket "${bucket.name}" contains logs and is using the STANDARD 
                         storage class which costs $0.023/GB. Logs are rarely accessed after 
                         30 days. Move older logs to S3 Intelligent-Tiering or Glacier 
                         to reduce cost by up to 70%. You can set a Lifecycle Policy to 
                         do this automatically.`,
                savings: 8.00,
                action: "s3_lifecycle",
                resourceId: bucket.name,
                icon: "🟡"
            });
        }

        // Check: Backup bucket using STANDARD (should be GLACIER)
        if (bucket.name.includes("backup") && bucket.storageClass === "STANDARD") {
            suggestions.push({
                type: "S3",
                severity: "medium",
                title: "Backup Data in Expensive Storage Class",
                detail: `Backup bucket "${bucket.name}" is using STANDARD storage ($0.023/GB). 
                         Since backups are rarely accessed, consider using S3 Glacier ($0.004/GB) 
                         or S3 Glacier Deep Archive ($0.00099/GB). This can reduce your backup 
                         storage cost by up to 95%.`,
                savings: 12.00,
                action: "s3_lifecycle",
                resourceId: bucket.name,
                icon: "💡"
            });
        }
    }
}


// =============================================
// EBS - Check for unattached volumes
// =============================================
function checkEBS(ebsService, suggestions) {
    if (!ebsService.volumes) return;

    for (let i = 0; i < ebsService.volumes.length; i++) {
        const vol = ebsService.volumes[i];

        // Unattached EBS volumes still cost money!
        if (vol.attached === false) {
            suggestions.push({
                type: "EBS",
                severity: "high",
                title: "Unattached EBS Volume Found",
                detail: `Volume ${vol.id} (${vol.size} GB, ${vol.type}) is not attached 
                         to any EC2 instance but you are still being charged $${vol.cost}/month. 
                         This often happens when an EC2 instance is terminated but its volume 
                         is accidentally kept. If this data is not needed, delete the volume 
                         to stop charges immediately.`,
                savings: vol.cost,
                action: "delete_snapshot",
                resourceId: vol.id,
                icon: "🔴"
            });
        }

        // Old gp2 volumes should be upgraded to gp3 (cheaper and faster)
        if (vol.type === "gp2" && vol.attached === true) {
            suggestions.push({
                type: "EBS",
                severity: "low",
                title: "Upgrade EBS Volume from gp2 to gp3",
                detail: `Volume ${vol.id} is using the older gp2 type. The newer gp3 type 
                         provides the same performance but costs 20% less. Upgrading is 
                         free, takes just a few minutes, and causes zero downtime. 
                         This is a quick win for saving money.`,
                savings: 2.00,
                action: "upgrade_volume",
                resourceId: vol.id,
                icon: "🟢"
            });
        }
    }
}


// =============================================
// RDS - Check for multi-AZ in dev environments
// =============================================
function checkRDS(rdsService, suggestions) {
    if (!rdsService.instances) return;

    for (let i = 0; i < rdsService.instances.length; i++) {
        const db = rdsService.instances[i];

        // Dev/test databases don't need Multi-AZ (it doubles the cost)
        if (db.id.includes("dev") && db.multiAZ === true) {
            suggestions.push({
                type: "RDS",
                severity: "medium",
                title: "Dev Database Using Multi-AZ (Unnecessary)",
                detail: `Your dev database "${db.id}" has Multi-AZ enabled, which creates 
                         a standby copy in another availability zone. This is great for 
                         production but unnecessary for development. Disabling Multi-AZ 
                         on dev databases can cut that database's cost in half.`,
                savings: 12.00,
                action: "disable_multi_az",
                resourceId: db.id,
                icon: "🟡"
            });
        }
    }
}


// =============================================
// Lambda - Check for high-duration functions
// =============================================
function checkLambda(lambdaService, suggestions) {
    if (!lambdaService.functions) return;

    for (let i = 0; i < lambdaService.functions.length; i++) {
        const fn = lambdaService.functions[i];

        // Lambda functions that run for a long time can be optimized
        if (fn.avgDuration > 300) { // more than 300ms average
            suggestions.push({
                type: "Lambda",
                severity: "low",
                title: "Lambda Function Has High Average Duration",
                detail: `Lambda function "${fn.name}" has an average execution time of 
                         ${fn.avgDuration}ms. Lambda charges per millisecond of execution. 
                         Review the function code for slow database queries, large file 
                         processing, or missing async/await. Optimizing this function's 
                         runtime could reduce Lambda costs noticeably.`,
                savings: 3.50,
                action: "optimize_lambda",
                resourceId: fn.name,
                icon: "🟢"
            });
        }
    }
}

module.exports = { analyze };
