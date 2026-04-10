// =============================================
// app.js - Frontend JavaScript Logic
// AWS Cost Optimization Engine Dashboard
// =============================================
// This file:
//   1. Fetches data from our backend API
//   2. Renders stats cards
//   3. Draws charts using Chart.js
//   4. Shows optimization suggestions
//   5. Handles filter, alert, and optimize actions
// =============================================

// Backend API base URL
// When running locally, server is on port 3000
 // localhost pe bhi kaam kare aur live site pe bhi
 const API_BASE = window.location.hostname === "localhost" 
    ? "http://localhost:3000/api" 
    : "/api";

// Store current data globally so filters can use it
let currentServices = [];
let currentSuggestions = [];
let pendingOptimization = null;  // stores action waiting in modal
let pieChart = null;             // Chart.js chart references
let lineChart = null;

// =============================================
// MAIN FUNCTION: Load everything on page open
// =============================================
async function loadDashboard() {
    try {
        // Show loading state
        document.getElementById("total-cost").textContent = "Loading...";
        document.getElementById("suggestions-list").innerHTML = '<div class="loading-msg">Analyzing your AWS usage...</div>';

        // Fetch dashboard summary from backend
        const dashRes = await fetch(`${API_BASE}/dashboard`);
        const dashData = await dashRes.json();

        // Fetch suggestions from backend
        const suggestRes = await fetch(`${API_BASE}/suggestions`);
        const suggestData = await suggestRes.json();

        if (!dashData.success) {
            throw new Error(dashData.message || "Failed to load dashboard data");
        }

        // Store data globally
        currentServices = dashData.data.services;
        currentSuggestions = suggestData.suggestions;

        // Render all sections
        renderStatCards(dashData.data);
        renderCostTable(dashData.data.services);
        populateServiceFilter(dashData.data.services);
        renderPieChart(dashData.data.services);
        renderLineChart(dashData.data.history);
        renderSuggestions(suggestData.suggestions);

        // Update billing period text
        const period = dashData.data.period;
        document.getElementById("billing-period").textContent = `${period.start} → ${period.end}`;

    } catch (err) {
        console.error("Error loading dashboard:", err);
        alert("Could not load dashboard data. Make sure the backend server is running.\n\nError: " + err.message);
    }
}


// =============================================
// RENDER STAT CARDS (top 4 summary cards)
// =============================================
function renderStatCards(data) {
    // Total cost
    document.getElementById("total-cost").textContent = `$${data.totalCost.toFixed(2)}`;

    // Month over month change
    const changeEl = document.getElementById("cost-change");
    const change = data.changePercent;
    if (change >= 0) {
        changeEl.textContent = `▲ ${change}% vs last month`;
        changeEl.style.color = "#f85149"; // Red for increase
    } else {
        changeEl.textContent = `▼ ${Math.abs(change)}% vs last month`;
        changeEl.style.color = "#3fb950"; // Green for decrease
    }

    // Top service
    document.getElementById("top-service").textContent = data.topService.name;
    document.getElementById("top-service-cost").textContent = `$${data.topService.cost.toFixed(2)} this month`;

    // Total services count
    document.getElementById("total-services").textContent = data.stats.totalServices;

    // Suggestion count (populated after suggestions render)
    document.getElementById("suggestion-count").textContent = "...";
}


// =============================================
// RENDER COST TABLE (service breakdown table)
// =============================================
function renderCostTable(services) {
    const tbody = document.getElementById("cost-table-body");
    tbody.innerHTML = ""; // Clear old rows

    // Sort by cost descending (highest first)
    const sorted = [...services].sort((a, b) => b.cost - a.cost);

    for (let i = 0; i < sorted.length; i++) {
        const svc = sorted[i];

        // Determine status badge based on cost percentage
        let statusClass, statusText;
        if (svc.percentage > 25) {
            statusClass = "status-high";
            statusText = "High";
        } else if (svc.percentage > 10) {
            statusClass = "status-medium";
            statusText = "Medium";
        } else {
            statusClass = "status-low";
            statusText = "Low";
        }

        // Build bar width proportional to cost percentage
        const barWidth = Math.min(svc.percentage, 100);

        // Create table row
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="service-name">${svc.fullName}</div>
            </td>
            <td class="cost-value">$${svc.cost.toFixed(2)}</td>
            <td>
                <div class="percent-bar">
                    <span style="font-family: monospace; font-size: 12px; color: var(--text-secondary); min-width:38px">${svc.percentage}%</span>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            </td>
            <td style="color: var(--text-secondary); font-size: 12px;">${svc.usage}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        `;
        tbody.appendChild(row);
    }
}


// =============================================
// RENDER PIE/DOUGHNUT CHART
// Using Chart.js
// =============================================
function renderPieChart(services) {
    const canvas = document.getElementById("pie-chart");
    const ctx = canvas.getContext("2d");

    // Destroy old chart if it exists (for refresh)
    if (pieChart) {
        pieChart.destroy();
    }

    // Prepare data arrays
    const labels = services.map(s => s.name);
    const values = services.map(s => s.cost);

    // Nice colors for each service
    const colors = [
        "#f0883e", "#58a6ff", "#3fb950", "#bc8cff",
        "#d29922", "#ff7b72", "#79c0ff", "#56d364"
    ];

    pieChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: "#161b22",
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        color: "#8b949e",
                        font: { size: 11, family: "IBM Plex Mono" },
                        padding: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // Show both $ and %
                            return ` ${context.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}


// =============================================
// RENDER LINE CHART (6-month trend)
// =============================================
function renderLineChart(history) {
    const canvas = document.getElementById("line-chart");
    const ctx = canvas.getContext("2d");

    // Destroy old chart if exists
    if (lineChart) {
        lineChart.destroy();
    }

    const labels = history.map(h => h.month);
    const values = history.map(h => h.cost);

    lineChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Total Cost ($)",
                data: values,
                borderColor: "#58a6ff",
                backgroundColor: "rgba(88, 166, 255, 0.1)",
                fill: true,
                tension: 0.4,        // Makes line smooth/curved
                pointRadius: 5,
                pointBackgroundColor: "#58a6ff",
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#8b949e",
                        font: { size: 11, family: "IBM Plex Mono" }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#6e7681", font: { size: 11, family: "IBM Plex Mono" } },
                    grid: { color: "#21262d" }
                },
                y: {
                    ticks: {
                        color: "#6e7681",
                        font: { size: 11, family: "IBM Plex Mono" },
                        callback: function(val) { return "$" + val; }
                    },
                    grid: { color: "#21262d" }
                }
            }
        }
    });
}


// =============================================
// RENDER SUGGESTIONS PANEL
// =============================================
function renderSuggestions(suggestions) {
    const container = document.getElementById("suggestions-list");
    container.innerHTML = "";

    // Update count badge
    document.getElementById("suggestion-count").textContent = suggestions.length;

    if (suggestions.length === 0) {
        container.innerHTML = '<div class="loading-msg">✅ No issues found! Your AWS costs look optimized.</div>';
        return;
    }

    // Calculate total potential savings
    let totalSavings = 0;

    for (let i = 0; i < suggestions.length; i++) {
        const s = suggestions[i];
        totalSavings += s.savings;

        const card = document.createElement("div");
        card.className = `suggestion-card severity-${s.severity}`;
        card.setAttribute("data-severity", s.severity);
        card.setAttribute("data-type", s.type);

        card.innerHTML = `
            <div class="suggestion-icon">${s.icon}</div>
            <div class="suggestion-content">
                <div class="suggestion-header">
                    <div class="suggestion-title">${s.title}</div>
                    <div class="suggestion-badges">
                        <span class="badge-service">${s.type}</span>
                        <span class="badge-savings">Save ~$${s.savings}/mo</span>
                    </div>
                </div>
                <div class="suggestion-detail">${s.detail}</div>
                <div class="suggestion-actions">
                    <button class="btn btn-green" onclick='openOptimizeModal(${JSON.stringify(s)})'>
                        ⚡ Optimize Now
                    </button>
                    <button class="btn btn-outline" onclick="dismissCard(this)">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    }

    // Show total savings at bottom
    const totalEl = document.getElementById("savings-total");
    totalEl.style.display = "flex";
    document.getElementById("total-savings-amount").textContent = `$${totalSavings.toFixed(2)}/month`;
}


// =============================================
// FILTER SUGGESTIONS BY SEVERITY
// =============================================
function filterSuggestions(severity, btn) {
    // Update active button style
    const allBtns = document.querySelectorAll(".filter-btn");
    allBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Show/hide suggestion cards
    const cards = document.querySelectorAll(".suggestion-card");
    cards.forEach(card => {
        if (severity === "all" || card.getAttribute("data-severity") === severity) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
}


// =============================================
// FILTER SERVICE IN PIE CHART
// =============================================
function populateServiceFilter(services) {
    const select = document.getElementById("service-filter");
    
    // Clear old options except "All"
    select.innerHTML = '<option value="all">All Services</option>';

    services.forEach(svc => {
        const opt = document.createElement("option");
        opt.value = svc.name;
        opt.textContent = svc.name;
        select.appendChild(opt);
    });
}

function filterService() {
    const selected = document.getElementById("service-filter").value;

    if (selected === "all") {
        renderPieChart(currentServices);
        return;
    }

    // Filter to only show selected service
    const filtered = currentServices.filter(s => s.name === selected);
    renderPieChart(filtered);
}


// =============================================
// COST ALERT: Check if current cost > threshold
// =============================================
async function checkAlert() {
    const threshold = document.getElementById("alert-threshold").value;
    const resultEl = document.getElementById("alert-result");

    if (!threshold || threshold <= 0) {
        resultEl.className = "alert-result error";
        resultEl.textContent = "Please enter a valid threshold amount.";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ threshold: parseFloat(threshold) })
        });

        const data = await res.json();

        resultEl.className = data.alert ? "alert-result error" : "alert-result success";
        resultEl.textContent = data.message;

        // Also show alert banner if triggered
        if (data.alert) {
            const banner = document.getElementById("alert-banner");
            const msgEl = document.getElementById("alert-message");
            msgEl.textContent = data.message;
            banner.style.display = "flex";
        }

    } catch (err) {
        resultEl.className = "alert-result error";
        resultEl.textContent = "Could not check alert. Server may be down.";
    }
}

function closeAlert() {
    document.getElementById("alert-banner").style.display = "none";
}


// =============================================
// OPTIMIZE NOW: Open confirmation modal
// =============================================
function openOptimizeModal(suggestion) {
    pendingOptimization = suggestion;

    document.getElementById("modal-title").textContent = `Optimize: ${suggestion.title}`;
    document.getElementById("modal-body").textContent =
        `This will apply: "${suggestion.action}" on resource "${suggestion.resourceId}". 
         Estimated savings: $${suggestion.savings}/month. This action is SIMULATED in demo mode.`;

    document.getElementById("modal-overlay").classList.add("show");
}

function closeModal() {
    document.getElementById("modal-overlay").classList.remove("show");
    pendingOptimization = null;
}

async function applyOptimization() {
    if (!pendingOptimization) return;

    try {
        const res = await fetch(`${API_BASE}/optimize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: pendingOptimization.action,
                resourceId: pendingOptimization.resourceId
            })
        });

        const data = await res.json();

        // Close modal
        closeModal();

        // Show result
        alert("✅ " + data.message);

    } catch (err) {
        alert("❌ Could not apply optimization. Server error: " + err.message);
    }
}


// =============================================
// DISMISS a suggestion card
// =============================================
function dismissCard(btn) {
    const card = btn.closest(".suggestion-card");
    card.style.opacity = "0";
    card.style.transition = "opacity 0.3s";
    setTimeout(() => card.remove(), 300);
}


// =============================================
// AUTO-LOAD: Run when page is ready
// =============================================
window.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
});
