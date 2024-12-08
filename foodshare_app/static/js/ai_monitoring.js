// AI Monitoring System

// Calculate days until expiry
function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate quality score based on various factors
function calculateQualityScore(item) {
    let score = 100;
    const daysUntilExpiry = getDaysUntilExpiry(item.expiration_date);
    
    // Deduct points based on days until expiry
    if (daysUntilExpiry <= 0) {
        score = 0;
    } else if (daysUntilExpiry <= 3) {
        score -= 60;
    } else if (daysUntilExpiry <= 7) {
        score -= 30;
    } else if (daysUntilExpiry <= 14) {
        score -= 10;
    }

    // Adjust score based on condition
    if (item.condition === 'near') {
        score -= 20;
    }

    // Ensure score stays within 0-100
    return Math.max(0, Math.min(100, score));
}

// Get priority level based on quality score
function getPriorityLevel(score) {
    if (score < 40) return 'Critical';
    if (score < 70) return 'High';
    if (score < 90) return 'Medium';
    return 'Low';
}

// Get recommended action based on quality score and days until expiry
function getRecommendedAction(score, daysUntilExpiry) {
    if (score < 40) {
        return 'Immediate distribution required';
    } else if (score < 70) {
        return 'Distribute within 24 hours';
    } else if (daysUntilExpiry <= 7) {
        return 'Plan for distribution this week';
    } else {
        return 'Regular monitoring';
    }
}

// Get priority row color
function getPriorityColor(priority) {
    switch (priority) {
        case 'Critical': return 'bg-red-50';
        case 'High': return 'bg-yellow-50';
        case 'Medium': return 'bg-blue-50';
        case 'Low': return 'bg-green-50';
    }
}

// Format category display
function formatCategory(category) {
    const categoryMap = {
        'packaged': 'Packaged Foods',
        'canned': 'Canned Foods',
        'beverages': 'Beverages',
        'snacks': 'Snacks',
        'other': 'Other'
    };
    return categoryMap[category] || category;
}

// Format condition display
function formatCondition(condition) {
    const conditionMap = {
        'new': 'New/Unused',
        'near': 'Near Expiry'
    };
    return conditionMap[condition] || condition;
}

// Update the priority queue table
function updatePriorityQueue(items) {
    const tableBody = document.getElementById('priorityQueueBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    // Sort items by quality score (ascending) and days until expiry (ascending)
    items.sort((a, b) => {
        const scoreA = calculateQualityScore(a);
        const scoreB = calculateQualityScore(b);
        if (scoreA === scoreB) {
            return getDaysUntilExpiry(a.expiration_date) - getDaysUntilExpiry(b.expiration_date);
        }
        return scoreA - scoreB;
    });

    items.forEach(item => {
        const daysUntilExpiry = getDaysUntilExpiry(item.expiration_date);
        const qualityScore = calculateQualityScore(item);
        const priority = getPriorityLevel(qualityScore);
        const recommendedAction = getRecommendedAction(qualityScore, daysUntilExpiry);

        const row = document.createElement('tr');
        row.className = getPriorityColor(priority);
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full 
                    ${priority === 'Critical' ? 'bg-red-100 text-red-800' : 
                    priority === 'High' ? 'bg-yellow-100 text-yellow-800' : 
                    priority === 'Medium' ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'}">
                    ${priority}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${item.name}</div>
                <div class="text-sm text-gray-500">${formatCategory(item.category)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm ${daysUntilExpiry <= 3 ? 'text-red-600' : 
                                    daysUntilExpiry <= 7 ? 'text-yellow-600' : 
                                    'text-gray-900'}">
                    ${daysUntilExpiry} days
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full ${
                        qualityScore < 40 ? 'bg-red-600' :
                        qualityScore < 70 ? 'bg-yellow-600' :
                        qualityScore < 90 ? 'bg-blue-600' :
                        'bg-green-600'
                    }" style="width: ${qualityScore}%"></div>
                </div>
                <span class="text-sm text-gray-500">${qualityScore}%</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${recommendedAction}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update quality insights
function updateQualityInsights(items) {
    let critical = 0, warning = 0, good = 0;
    
    items.forEach(item => {
        const score = calculateQualityScore(item);
        if (score < 40) critical++;
        else if (score < 70) warning++;
        else good++;
    });

    const criticalElement = document.getElementById('criticalCount');
    const warningElement = document.getElementById('warningCount');
    const goodElement = document.getElementById('goodCount');

    if (criticalElement) criticalElement.textContent = critical;
    if (warningElement) warningElement.textContent = warning;
    if (goodElement) goodElement.textContent = good;
}

// Generate AI recommendations
function updateAIRecommendations(items) {
    const recommendationsDiv = document.getElementById('aiRecommendations');
    if (!recommendationsDiv) return;

    const recommendations = [];

    // Analyze expiry patterns
    const criticalItems = items.filter(item => calculateQualityScore(item) < 40);
    if (criticalItems.length > 0) {
        recommendations.push({
            type: 'critical',
            message: `${criticalItems.length} items require immediate attention. Prioritize distribution of these items.`
        });
    }

    // Analyze category distribution
    const categoryCount = {};
    items.forEach(item => {
        const formattedCategory = formatCategory(item.category);
        categoryCount[formattedCategory] = (categoryCount[formattedCategory] || 0) + 1;
    });
    
    if (Object.keys(categoryCount).length > 0) {
        const dominantCategory = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])[0];
        recommendations.push({
            type: 'insight',
            message: `${dominantCategory[0]} is the most common category (${dominantCategory[1]} items). Consider diversifying incoming donations.`
        });
    }

    // Generate distribution planning recommendation
    const nearExpiryItems = items.filter(item => getDaysUntilExpiry(item.expiration_date) <= 7);
    if (nearExpiryItems.length > 0) {
        recommendations.push({
            type: 'warning',
            message: `Plan distribution for ${nearExpiryItems.length} items expiring within 7 days.`
        });
    }

    // Update recommendations UI
    recommendationsDiv.innerHTML = recommendations.map(rec => `
        <div class="flex items-start p-4 ${
            rec.type === 'critical' ? 'bg-red-50' :
            rec.type === 'warning' ? 'bg-yellow-50' :
            'bg-blue-50'
        } rounded-lg">
            <div class="flex-shrink-0">
                <i class="fas ${
                    rec.type === 'critical' ? 'fa-exclamation-triangle text-red-600' :
                    rec.type === 'warning' ? 'fa-exclamation text-yellow-600' :
                    'fa-lightbulb text-blue-600'
                } text-lg"></i>
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium ${
                    rec.type === 'critical' ? 'text-red-800' :
                    rec.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                }">${rec.message}</p>
            </div>
        </div>
    `).join('');
}

// Main function to load and process food items
async function loadAIMonitoring() {
    try {
        const response = await fetch('/get-all-food-items/');
        const data = await response.json();
        
        if (data.success && data.items && data.items.length > 0) {
            updatePriorityQueue(data.items);
            updateQualityInsights(data.items);
            updateAIRecommendations(data.items);
        } else {
            console.log('No food items found or error in response');
        }
    } catch (error) {
        console.error('Error loading AI monitoring data:', error);
    }
}

// Initialize monitoring when the section becomes visible
document.addEventListener('DOMContentLoaded', function() {
    const aiMonitoringLink = document.querySelector('a[href="#ai-monitoring"]');
    if (aiMonitoringLink) {
        aiMonitoringLink.addEventListener('click', function() {
            loadAIMonitoring();
        });
    }
}); 