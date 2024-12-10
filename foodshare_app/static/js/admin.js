// Configuration for notifications
const NOTIFICATIONS_PER_PAGE = 5;
let currentPage = 1;
let isLoadingMore = false;

// Initialize empty notifications array
const mockNotifications = [];

function getNotificationIcon(type) {
    switch (type) {
        case 'donation':
            return 'fas fa-gift';
        case 'expiry':
            return 'fas fa-clock';
        case 'system':
            return 'fas fa-cog';
        default:
            return 'fas fa-bell';
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function populateNotifications() {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    const unreadCountElement = document.getElementById('unreadCount');
    
    // Hide notification count by default
    if (notificationCount) {
        notificationCount.classList.add('hidden');
    }
    
    // Set unread count text
    if (unreadCountElement) {
        unreadCountElement.textContent = 'No unread';
    }
    
    // Clear existing notifications
    if (notificationList) {
        notificationList.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-gray-500">
                <i class="fas fa-bell-slash text-gray-400 text-3xl mb-3"></i>
                <p class="text-sm">No notifications yet</p>
            </div>
        `;
    }
}

function loadMoreNotifications() {
    // Do nothing since we're not loading any notifications
}

function markAsRead(notificationId, event) {
    // Do nothing since we have no notifications to mark as read
}

function markAllAsRead() {
    // Do nothing since we have no notifications to mark as read
}

// Initialize scroll handler for infinite scroll
function initializeNotificationScroll() {
    const notificationList = document.getElementById('notificationList');
    
    if (notificationList) {
        notificationList.addEventListener('scroll', () => {
            // Do nothing since we have no notifications to load
        });
    }
}

// Reset notifications when closing dropdown
function resetNotifications() {
    currentPage = 1;
    isLoadingMore = false;
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    const isHidden = dropdown.classList.contains('hidden');
    
    if (isHidden) {
        dropdown.classList.remove('hidden');
        requestAnimationFrame(() => {
            dropdown.classList.add('opacity-100', 'translate-y-0');
            dropdown.classList.remove('opacity-0', '-translate-y-2');
        });
        resetNotifications();
        populateNotifications();
    } else {
        dropdown.classList.add('opacity-0', '-translate-y-2');
        dropdown.classList.remove('opacity-100', 'translate-y-0');
        setTimeout(() => {
            dropdown.classList.add('hidden');
        }, 150);
    }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('notificationDropdown');
    const notificationBtn = document.getElementById('notificationBtn');
    
    // Add click event listener to notification button
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotifications);
    }
    
    // Add transition classes to dropdown
    if (dropdown) {
        dropdown.classList.add('transition-all', 'duration-150', 'ease-out',
                             'opacity-0', '-translate-y-2');
    }
    
    // Initialize other features
    initializeNotificationScroll();
    populateNotifications();
    
    // Initialize donor list if we're on the donor section
    if (window.location.hash === '#donors' || document.getElementById('donorTableBody')) {
        console.log('Initializing donor list...');
        loadDonors();
    }

    // Add hash change listener for section navigation
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        console.log('Hash changed to:', hash);
        showSection(hash.slice(1) || 'dashboard');
    });
    
    // Close notifications when clicking outside
    document.addEventListener('click', (e) => {
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');
        const notificationList = document.getElementById('notificationList');
        
        // Only close if click is outside notification area and button
        if (!notificationBtn?.contains(e.target) && 
            !notificationDropdown?.contains(e.target) && 
            !notificationList?.contains(e.target)) {
            notificationDropdown?.classList.add('hidden');
        }
    });
});

// Function to load donors
function loadDonors() {
    console.log('Loading donors...');
    fetch('/get_all_donors/')
        .then(response => {
            console.log('Donor response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Donor data received:', data);
            const tableBody = document.getElementById('donorTableBody');
            if (!tableBody) {
                console.error('Donor table body not found in the DOM');
                return;
            }

            tableBody.innerHTML = '';

            if (data.success && data.donors && data.donors.length > 0) {
                console.log('Found', data.donors.length, 'donors');
                data.donors.forEach(donor => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">${donor.username}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${donor.email}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <button onclick="viewDonorDetails(${donor.id})" 
                                    class="text-blue-600 hover:text-blue-900" 
                                    title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="openEditDonorModal(${donor.id})" 
                                    class="text-green-600 hover:text-green-900" 
                                    title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="confirmDeleteDonor(${donor.id})" 
                                    class="text-red-600 hover:text-red-900" 
                                    title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button onclick="viewDonorDonations(${donor.id})" 
                                    class="text-indigo-600 hover:text-indigo-900" 
                                    title="View Donations">
                                <i class="fas fa-gift"></i>
                            </button>
                            <button onclick="toggleDonorStatus(${donor.id}, ${donor.is_active})" 
                                    class="text-${donor.is_active ? 'yellow' : 'green'}-600 hover:text-${donor.is_active ? 'yellow' : 'green'}-900" 
                                    title="${donor.is_active ? 'Deactivate' : 'Activate'} Account">
                                <i class="fas fa-${donor.is_active ? 'ban' : 'check-circle'}"></i>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                console.log('No donors found or data.success is false');
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-6 py-4 text-center text-gray-500">
                            No donors found
                        </td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading donors:', error);
            const tableBody = document.getElementById('donorTableBody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-6 py-4 text-center text-red-500">
                            Error loading donors. Please try again.
                        </td>
                    </tr>
                `;
            }
        });
}

// Function to view donor details
function viewDonorDetails(donorId) {
    fetch(`/get_donor/${donorId}/`)
        .then(response => response.json())
        .then(data => {
            // Show donor details in a modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
            modal.innerHTML = `
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Donor Details</h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Username</label>
                                <p class="mt-1 text-sm text-gray-900">${data.username}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Email</label>
                                <p class="mt-1 text-sm text-gray-900">${data.email}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Account Status</label>
                                <p class="mt-1 text-sm ${data.is_active ? 'text-green-600' : 'text-red-600'}">
                                    ${data.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Join Date</label>
                                <p class="mt-1 text-sm text-gray-900">${formatDate(data.date_joined)}</p>
                            </div>
                        </div>
                        <div class="mt-5 flex justify-end">
                            <button onclick="this.closest('.fixed').remove()" 
                                    class="bg-gray-500 text-white px-4 py-2 rounded-lg">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        });
}

// Function to view donor's donations
function viewDonorDonations(donorId) {
    fetch(`/get_donor_donations/${donorId}/`)
        .then(response => response.json())
        .then(data => {
            // Show donor's donations in a modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
            modal.innerHTML = `
                <div class="relative top-20 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Donor's Donations</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donation No.</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    ${data.donations.length > 0 ? 
                                        data.donations.map(donation => `
                                            <tr>
                                                <td class="px-6 py-4 whitespace-nowrap">${donation.donation_no}</td>
                                                <td class="px-6 py-4 whitespace-nowrap">${formatDate(donation.submission_date)}</td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                          donation.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                                                          donation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                                          'bg-red-100 text-red-800'}">
                                                        ${donation.status}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button onclick="viewDonationDetails('${donation.donation_no}')" 
                                                            class="text-blue-600 hover:text-blue-900">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('') : 
                                        `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No donations found</td></tr>`
                                    }
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-5 flex justify-end">
                            <button onclick="this.closest('.fixed').remove()" 
                                    class="bg-gray-500 text-white px-4 py-2 rounded-lg">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        });
}

// Function to toggle donor's account status
function toggleDonorStatus(donorId, currentStatus) {
    fetch(`/toggle_donor_status/${donorId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            is_active: !currentStatus
        })
    })
    .then(response => {
        if (response.ok) {
            loadDonors(); // Reload the donor list
        } else {
            alert('Error updating donor status');
        }
    });
}

// Add this to your existing showSection function
function showSection(sectionId) {
    // Hide all sections first
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
        
        // Load specific section data if needed
        if (sectionId === 'food-items-section') {
            loadFoodItems();
        } else if (sectionId === 'donors') {
            loadDonors(); // Load donors when the section is shown
        }
    }
}

// Donor Modal Functions
function showAddDonorModal() {
    document.getElementById('addDonorModal').classList.remove('hidden');
}

function closeAddDonorModal() {
    document.getElementById('addDonorModal').classList.add('hidden');
    document.getElementById('addDonorForm').reset();
}

function openEditDonorModal(donorId) {
    currentDonorId = donorId;
    const modal = document.getElementById('editDonorModal');
    modal.classList.remove('hidden');
    
    // Fetch donor details and populate form
    fetch(`/get_donor/${donorId}/`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('editDonorId').value = data.id;
            document.getElementById('editUsername').value = data.username;
            document.getElementById('editEmail').value = data.email;
        });
}

function closeEditDonorModal() {
    document.getElementById('editDonorModal').classList.add('hidden');
    document.getElementById('editDonorForm').reset();
    currentDonorId = null;
}

function confirmDeleteDonor(donorId) {
    currentDonorId = donorId;
    document.getElementById('deleteDonorModal').classList.remove('hidden');
}

function closeDonorDeleteModal() {
    document.getElementById('deleteDonorModal').classList.add('hidden');
    currentDonorId = null;
}
