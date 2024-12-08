// Configuration for notifications
const NOTIFICATIONS_PER_PAGE = 5;
let currentPage = 1;
let isLoadingMore = false;

// Mock notifications data for demonstration
const mockNotifications = [
    {
        id: 1,
        title: "New Donation Request",
        message: "A new donation has been submitted by John Doe",
        timestamp: "2024-01-20T10:30:00",
        isRead: false,
        type: "donation"
    },
    {
        id: 2,
        title: "Food Item Expiring Soon",
        message: "5 food items are expiring within 24 hours",
        timestamp: "2024-01-20T09:15:00",
        isRead: false,
        type: "expiry"
    },
    {
        id: 3,
        title: "System Update",
        message: "The system will undergo maintenance in 2 hours",
        timestamp: "2024-01-20T08:00:00",
        isRead: true,
        type: "system"
    },
    {
        id: 4,
        title: "Donation Approved",
        message: "Donation #1234 has been approved by the admin",
        timestamp: "2024-01-19T15:30:00",
        isRead: false,
        type: "donation"
    },
    {
        id: 5,
        title: "New Food Category Added",
        message: "A new food category 'Beverages' has been added to the system",
        timestamp: "2024-01-19T14:20:00",
        isRead: true,
        type: "system"
    },
    {
        id: 6,
        title: "Multiple Items Expiring",
        message: "10 items in the dairy category will expire soon",
        timestamp: "2024-01-19T12:00:00",
        isRead: false,
        type: "expiry"
    },
    {
        id: 7,
        title: "Donation Completed",
        message: "Donation #1235 has been successfully distributed",
        timestamp: "2024-01-19T10:45:00",
        isRead: true,
        type: "donation"
    },
    {
        id: 8,
        title: "New User Registration",
        message: "A new donor 'Jane Smith' has registered on the platform",
        timestamp: "2024-01-19T09:30:00",
        isRead: true,
        type: "system"
    },
    {
        id: 9,
        title: "Storage Alert",
        message: "Cold storage unit #2 temperature is above normal",
        timestamp: "2024-01-19T08:15:00",
        isRead: false,
        type: "system"
    },
    {
        id: 10,
        title: "Weekly Summary",
        message: "View your donation activity summary for this week",
        timestamp: "2024-01-19T07:00:00",
        isRead: true,
        type: "system"
    }
];

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
    const unreadCount = mockNotifications.filter(n => !n.isRead).length;
    
    // Update notification count badge
    if (unreadCount > 0) {
        notificationCount.textContent = unreadCount;
        notificationCount.classList.remove('hidden');
        unreadCountElement.textContent = `${unreadCount} unread`;
    } else {
        notificationCount.classList.add('hidden');
        unreadCountElement.textContent = 'No unread';
    }
    
    // Clear existing notifications
    notificationList.innerHTML = '';
    
    // Add notifications or show empty state
    if (mockNotifications.length === 0) {
        notificationList.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-bell-slash text-gray-400 text-xl mb-2"></i>
                <p>No notifications at the moment</p>
            </div>
        `;
        return;
    }
    
    // Get paginated notifications
    const paginatedNotifications = mockNotifications.slice(0, currentPage * NOTIFICATIONS_PER_PAGE);
    
    // Add notifications
    paginatedNotifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${notification.isRead ? '' : 'bg-blue-50'}`;
        
        const icon = getNotificationIcon(notification.type);
        
        notificationElement.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 pt-0.5">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 bg-opacity-10">
                        <i class="${icon} text-blue-600"></i>
                    </span>
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 ${notification.isRead ? '' : 'font-bold'}">
                        ${notification.title}
                    </p>
                    <p class="mt-1 text-sm text-gray-500 line-clamp-2">
                        ${notification.message}
                    </p>
                    <p class="mt-1 text-xs text-gray-400 flex items-center">
                        <i class="fas fa-clock mr-1"></i>
                        ${formatTimestamp(notification.timestamp)}
                    </p>
                </div>
                <div class="flex-shrink-0 w-2">
                    <div class="h-2 w-2 rounded-full ${notification.isRead ? 'bg-transparent' : 'bg-blue-600'}"></div>
                </div>
            </div>
        `;
        
        notificationElement.addEventListener('click', (event) => markAsRead(notification.id, event));
        notificationList.appendChild(notificationElement);
    });
    
    // Add "Load More" button if there are more notifications
    if (currentPage * NOTIFICATIONS_PER_PAGE < mockNotifications.length) {
        const loadMoreButton = document.createElement('div');
        loadMoreButton.className = 'p-3 text-center text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 cursor-pointer border-t border-gray-100';
        loadMoreButton.innerHTML = `
            <span class="font-medium">Load More</span>
            <span class="text-gray-500 ml-1">(${mockNotifications.length - (currentPage * NOTIFICATIONS_PER_PAGE)} remaining)</span>
        `;
        loadMoreButton.onclick = loadMoreNotifications;
        notificationList.appendChild(loadMoreButton);
    }
}

function loadMoreNotifications() {
    if (!isLoadingMore) {
        isLoadingMore = true;
        currentPage++;
        populateNotifications();
        isLoadingMore = false;
    }
}

function markAsRead(notificationId, event) {
    // Prevent event from bubbling up to document click handler
    event.stopPropagation();
    
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
        notification.isRead = true;
    }
    populateNotifications();
}

function markAllAsRead() {
    mockNotifications.forEach(notification => {
        notification.isRead = true;
    });
    populateNotifications();
}

// Initialize scroll handler for infinite scroll
function initializeNotificationScroll() {
    const notificationList = document.getElementById('notificationList');
    
    notificationList.addEventListener('scroll', () => {
        if (!isLoadingMore && 
            notificationList.scrollHeight - notificationList.scrollTop <= notificationList.clientHeight + 100) {
            loadMoreNotifications();
        }
    });
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
