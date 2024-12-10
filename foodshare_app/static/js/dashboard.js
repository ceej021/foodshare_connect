document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('donationDetailsModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    
    initializeModals();
    initializeNavigation();
    initializeViewButtons();
    updateRecentDonationsInfo();
    
    // Show dashboard section by default
    showDefaultSection();
});

function showDefaultSection() {
    const dashboardSection = document.getElementById('dashboard');
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    
    if (dashboardSection && dashboardLink) {
        // Remove active class from all sections and links
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-item').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show dashboard section and activate its link
        dashboardSection.classList.add('active');
        dashboardLink.classList.add('active');
    }
}

function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = button.closest('.modal');
            modal.style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function initializeViewButtons() {
    const viewButtons = document.querySelectorAll('.btn-view');
    const modal = document.getElementById('donationDetailsModal');
    const detailsContainer = document.getElementById('donationDetails');

    viewButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const donationNo = this.getAttribute('data-donation');
            try {
                const response = await fetch(`/get-donation-details/${donationNo}/`);
                const data = await response.json();
                
                if (data.success) {
                    const donation = data.data;
                    detailsContainer.innerHTML = `
                        <div class="donation-info">
                            <div class="donation-header">
                                <div class="donation-id">
                                    <h3>#${donation.donation_no}</h3>
                                    <span class="status-badge ${donation.status.toLowerCase()}">
                                        ${donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                                    </span>
                                </div>
                                <div class="donation-date">
                                    <i class="fas fa-calendar"></i>
                                    ${donation.submission_date}
                                </div>
                            </div>

                            <div class="info-grid">
                                <div class="info-section">
                                    <h4><i class="fas fa-user"></i> Contact Information</h4>
                                    <div class="info-content">
                                        <p><strong>Contact:</strong> ${donation.contact}</p>
                                        <p><strong>Address:</strong> ${donation.address}</p>
                                    </div>
                                </div>

                                <div class="info-section">
                                    <h4><i class="fas fa-truck"></i> Delivery Details</h4>
                                    <div class="info-content">
                                        <p><strong>Method:</strong> ${donation.delivery_method}</p>
                                        ${donation.preferred_date ? `
                                            <p><strong>Preferred Date:</strong> ${donation.preferred_date}</p>
                                            <p><strong>Preferred Time:</strong> ${donation.preferred_time}</p>
                                        ` : ''}
                                        ${donation.dropoff_location ? `
                                            <p><strong>Dropoff Location:</strong> ${donation.dropoff_location}</p>
                                        ` : ''}
                                    </div>
                                </div>

                                ${donation.remarks ? `
                                    <div class="info-section full-width">
                                        <h4><i class="fas fa-comment"></i> Additional Remarks</h4>
                                        <div class="info-content">
                                            <p>${donation.remarks}</p>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            <div class="food-items">
                                <h4><i class="fas fa-box-open"></i> Food Items</h4>
                                <div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Category</th>
                                                <th>Quantity</th>
                                                <th>Condition</th>
                                                <th>Expiration Date</th>
                                                <th>Photo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${donation.food_items.map(item => `
                                                <tr>
                                                    <td>${item.name}</td>
                                                    <td>${item.category}</td>
                                                    <td>${item.quantity} ${item.unit}</td>
                                                    <td>${item.condition}</td>
                                                    <td>${item.expiration_date}</td>
                                                    <td>
                                                        ${item.photo ? `
                                                            <img src="${item.photo}" alt="${item.name}" class="food-item-photo">
                                                        ` : 'No photo'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                    modal.classList.add('show');
                } else {
                    alert('Error loading donation details');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error loading donation details');
            }
        });
    });
}

function expandImage(img) {
    if (!img.src) return;
    
    const expandedImg = document.createElement('div');
    expandedImg.className = 'expanded-image';
    expandedImg.innerHTML = `
        <div class="overlay" onclick="this.parentElement.remove()"></div>
        <img src="${img.src}" alt="Expanded food item photo">
    `;
    document.body.appendChild(expandedImg);
}

async function loadDonationHistory(page = 1) {
    const historyTable = document.querySelector('#donation-history .table-container tbody');
    const paginationContainer = document.querySelector('#donation-history .pagination');
    
    if (historyTable) {
        try {
            const response = await fetch(`/get-donation-history/?page=${page}`);
            const data = await response.json();
            if (data.success) {
                // Update table content
                historyTable.innerHTML = data.donations.map(donation => `
                    <tr>
                        <td>#${donation.donation_no}</td>
                        <td>${donation.submission_date}</td>
                        <td>
                            <span class="status-badge ${donation.status}">
                                ${donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                            </span>
                        </td>
                        <td>
                            <button class="btn-view" data-donation="${donation.donation_no}">
                                View Details
                            </button>
                        </td>
                    </tr>
                `).join('');

                // Update pagination
                const pagination = data.pagination;
                paginationContainer.innerHTML = `
                    <div class="pagination-controls">
                        <button class="pagination-btn" 
                                onclick="loadDonationHistory(${pagination.current_page - 1})"
                                ${!pagination.has_previous ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="pagination-info">
                            Page ${pagination.current_page} of ${pagination.total_pages}
                        </span>
                        <button class="pagination-btn" 
                                onclick="loadDonationHistory(${pagination.current_page + 1})"
                                ${!pagination.has_next ? 'disabled' : ''}>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                `;
                
                // Reinitialize view buttons
                initializeViewButtons();
            }
        } catch (error) {
            console.error('Error loading donation history:', error);
        }
    }
}

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.classList.contains('logout')) return;
            
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);

            // Remove active class from all sections and links
            sections.forEach(section => {
                section.classList.remove('active');
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
            });

            // Show target section and activate clicked link
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                this.classList.add('active');

                // Load donation history when the section is activated
                if (targetId === 'donation-history') {
                    loadDonationHistory();
                }
            }
        });
    });
}

function updateRecentDonationsInfo() {
    const recentDonationsContainer = document.querySelector('.recent-donations');
    if (recentDonationsContainer) {
        const infoText = document.createElement('div');
        infoText.className = 'recent-donations-info';
        infoText.innerHTML = 'Showing 5 most recent donations';
        recentDonationsContainer.appendChild(infoText);
    }
}

function debugModalPositioning() {
    const modal = document.querySelector('#donationDetailsModal');
    const content = modal.querySelector('.modal-content');
    
    // Add visual debug outline
    content.style.outline = '2px solid red';
    
    // Create debug overlay
    const debugOverlay = document.createElement('div');
    debugOverlay.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        font-family: monospace;
        z-index: 9999;
        pointer-events: none;
    `;
    document.body.appendChild(debugOverlay);

    function updateDebug() {
        const contentRect = content.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(content);
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const contentCenterX = contentRect.left + contentRect.width / 2;
        const contentCenterY = contentRect.top + contentRect.height / 2;
        
        debugOverlay.innerHTML = `
            <div style="font-size: 12px;">
                <strong>Modal Position Debug</strong><br>
                Position: ${computedStyle.position}<br>
                Top: ${computedStyle.top}<br>
                Left: ${computedStyle.left}<br>
                Transform: ${computedStyle.transform}<br>
                Margin: ${computedStyle.margin}<br>
                Offset from center: ${Math.round(centerX - contentCenterX)}px, ${Math.round(centerY - contentCenterY)}px
            </div>
        `;
        
        console.log('Modal Debug:', {
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            content: {
                rect: contentRect,
                style: {
                    position: computedStyle.position,
                    top: computedStyle.top,
                    left: computedStyle.left,
                    transform: computedStyle.transform,
                    margin: computedStyle.margin
                },
                centerOffset: {
                    x: centerX - contentCenterX,
                    y: centerY - contentCenterY
                }
            }
        });
    }

    // Update on various events
    const update = () => requestAnimationFrame(updateDebug);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);
    
    // Initial update
    updateDebug();

    // Return cleanup function
    return () => {
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update);
        debugOverlay.remove();
        content.style.outline = '';
    };
}

function viewDonationDetails(donationId) {
    const modal = document.getElementById('donationDetailsModal');
    const detailsContainer = document.getElementById('donationDetails');
    
    // ... existing code ...
    
    modal.classList.add('show');
    
    // Start debug visualization
    const cleanup = debugModalPositioning();
    
    // Cleanup debug on modal close
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        cleanup();
        modal.classList.remove('show');
    });
}