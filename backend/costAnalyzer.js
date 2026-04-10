// =============================================
// costAnalyzer.js - Cost Analysis Logic
// =============================================
// Takes raw AWS data and computes useful metrics:
// - Total costs
// - Per-service breakdown
// - Percentage share of each service
// - Month-over-month change
// =============================================

// Calculate total cost from all services
function getTotalCost(services) {
    let total = 0;
    for (let i = 0; i < services.length; i++) {
        total += services[i].cost;
    }
    return parseFloat(total.toFixed(2));
}

// Find which service costs the most
function getTopService(services) {
    let top = services[0];
    for (let i = 1; i < services.length; i++) {
        if (services[i].cost > top.cost) {
            top = services[i];
        }
    }
    return top;
}

// Calculate what % each service is of total cost
function getServicePercentages(services, totalCost) {
    return services.map(service => ({
        name: service.name,
        fullName: service.fullName || service.name,
        cost: service.cost,
        percentage: parseFloat(((service.cost / totalCost) * 100).toFixed(1)),
        usage: service.usage || "N/A"
    }));
}

// Calculate month-over-month cost change
function getCostChange(history) {
    if (!history || history.length < 2) return 0;
    
    const thisMonth = history[history.length - 1].cost;
    const lastMonth = history[history.length - 2].cost;
    
    // Calculate % change
    const change = ((thisMonth - lastMonth) / lastMonth) * 100;
    return parseFloat(change.toFixed(1));
}

// Estimate projected cost for the full month
// (useful if we only have partial month data)
function getProjectedCost(currentCost, dayOfMonth) {
    const avgDailyRate = currentCost / dayOfMonth;
    const projected = avgDailyRate * 30; // assume 30-day month
    return parseFloat(projected.toFixed(2));
}

// =============================================
// MAIN FUNCTION: Build the full summary object
// This is what the /api/dashboard route uses
// =============================================
function getSummary(rawData) {
    const { services, history, period } = rawData;

    const totalCost = getTotalCost(services);
    const topService = getTopService(services);
    const breakdown = getServicePercentages(services, totalCost);
    const costChange = getCostChange(history);

    // Build the final summary
    const summary = {
        totalCost: totalCost,
        period: period,
        
        // Month-over-month comparison
        changePercent: costChange,
        changeDirection: costChange >= 0 ? "up" : "down",
        
        // Most expensive service
        topService: {
            name: topService.name,
            cost: topService.cost
        },
        
        // Service-wise breakdown (for table and chart)
        services: breakdown,
        
        // Historical data for trend chart
        history: history,
        
        // Quick stats for the summary cards
        stats: {
            totalServices: services.length,
            avgCostPerService: parseFloat((totalCost / services.length).toFixed(2)),
            highestCostService: topService.name,
            costThisMonth: totalCost
        }
    };

    return summary;
}

module.exports = { getSummary, getTotalCost, getTopService };
