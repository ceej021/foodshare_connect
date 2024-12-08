let foodItemCount = 0;

function addFoodItem() {
    const foodItems = document.getElementById('foodItems');
    const foodItem = document.createElement('div');
    foodItem.className = 'df-p-4 df-bg-white df-rounded-lg df-border df-border-gray-200 df-shadow-sm df-relative';
    foodItem.id = `foodItem${foodItemCount}`;

    foodItem.innerHTML = `
        <button type="button" onclick="removeDonationFoodItem(${foodItemCount})" 
            class="df-absolute df-top-4 df-right-4 df-text-red-500 hover:df-text-red-700 df-transition-colors df-cursor-pointer df-z-10">
            <i class="fas fa-times df-text-xl"></i>
        </button>
        <div class="df-space-y-4 df-mt-2">
            <div>
                <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Food Item Name *</label>
                <input type="text" required class="form-input">
            </div>
            <div>
                <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Category *</label>
                <select required class="form-input food-category">
                    <option value="">Select Category</option>
                    <option value="packaged">Packaged Foods</option>
                    <option value="canned">Canned Foods</option>
                    <option value="beverages">Beverages</option>
                    <option value="snacks">Snacks</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Quantity *</label>
                <input type="number" min="1" required class="form-input">
            </div>
            <div>
                <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Condition *</label>
                <select required class="form-input food-condition">
                    <option value="">Select Condition</option>
                    <option value="new">New/Unused</option>
                    <option value="near">Near Expiry</option>
                </select>
            </div>
            <div>
                <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Expiration Date *</label>
                <input type="date" required class="form-input">
            </div>
            <div>
                <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Food Photo</label>
                <input type="file" accept="image/*" onchange="previewImage(event, ${foodItemCount})"
                    class="df-block df-w-full df-text-sm df-text-gray-500 file:df-mr-4 file:df-py-2 file:df-px-4 file:df-rounded-md file:df-border-0 file:df-text-sm file:df-font-medium file:df-bg-primary-50 file:df-text-primary-700 hover:file:df-bg-primary-100">
                <div class="df-mt-2 df-max-w-xs" id="preview${foodItemCount}"></div>
            </div>
        </div>
    `;

    foodItems.appendChild(foodItem);
    foodItemCount++;
}

function removeDonationFoodItem(id) {
    const foodItem = document.getElementById(`foodItem${id}`);
    if (foodItem) {
        foodItem.remove();
    }
}

function previewImage(event, id) {
    const input = event.target;
    const preview = document.getElementById(`preview${id}`);
    
    if (input.files && input.files[0]) {
        // Check file size
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (input.files[0].size > maxSize) {
            alert('Image size should not exceed 2MB');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Food item preview" class="df-rounded-lg df-max-w-[200px] df-max-h-[200px] df-object-cover">
                <button type="button" onclick="removeImage(${id})" 
                    class="df-absolute df-top-0 df-right-0 df-transform df-translate-x-1/2 df--translate-y-1/2 df-bg-red-500 df-text-white df-rounded-full df-w-6 df-h-6 df-flex df-items-center df-justify-center df-text-sm">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function removeImage(id) {
    const fileInput = document.getElementById(`foodPhoto${id}`);
    const preview = document.getElementById(`preview${id}`);
    if (fileInput) fileInput.value = '';
    if (preview) preview.innerHTML = '';
}

function toggleDeliveryOptions() {
    const deliveryOptions = document.getElementById('deliveryOptions');
    const ngoPickup = document.querySelector('input[value="ngo"]');

    if (deliveryOptions) {
        if (ngoPickup && ngoPickup.checked) {
            deliveryOptions.innerHTML = `
                <div>
                    <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Preferred Pickup Date *</label>
                    <input type="date" required class="form-input">
                </div>
                <div>
                    <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Preferred Pickup Time *</label>
                    <input type="time" required class="form-input">
                </div>
            `;
        } else {
            deliveryOptions.innerHTML = `
                <div>
                    <label class="df-block df-text-sm df-font-medium df-text-gray-700 df-mb-1">Dropoff Location *</label>
                    <select required class="form-input dropoff-location">
                        <option value="">Select Location</option>
                        <option value="main">Main NGO Office - 123 Charity Street, City Center</option>
                    </select>
                </div>
            `;
        }
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    
    try {
        // Collect form data
        const formData = {
            contact: document.getElementById('contact').value,
            address: document.getElementById('address').value,
            delivery_method: document.querySelector('input[name="deliveryMethod"]:checked')?.value,
            remarks: document.getElementById('remarks').value,
            food_items: []
        };
        
        // Validate delivery method
        if (!formData.delivery_method) {
            alert('Please select a delivery method');
            return;
        }
        
        // Add delivery details based on method
        if (formData.delivery_method === 'ngo') {
            formData.preferred_date = document.querySelector('input[type="date"]').value;
            formData.preferred_time = document.querySelector('input[type="time"]').value;
            
            if (!formData.preferred_date || !formData.preferred_time) {
                alert('Please select preferred pickup date and time');
                return;
            }
        } else {
            formData.dropoff_location = document.querySelector('.dropoff-location').value;
            if (!formData.dropoff_location) {
                alert('Please select a dropoff location');
                return;
            }
        }
        
        // Collect food items
        const foodItemsContainer = document.getElementById('foodItems');
        const foodItems = foodItemsContainer.querySelectorAll('.df-p-4.df-bg-white');
        
        if (foodItems.length === 0) {
            alert('Please add at least one food item');
            return;
        }
        
        for (const item of foodItems) {
            const foodItem = {
                name: item.querySelector('input[type="text"]').value,
                category: item.querySelector('.food-category').value,
                quantity: parseInt(item.querySelector('input[type="number"]').value),
                condition: item.querySelector('.food-condition').value,
                expiration_date: item.querySelector('input[type="date"]').value
            };
            
            // Validate food item
            if (!foodItem.name || !foodItem.category || !foodItem.quantity || !foodItem.condition || !foodItem.expiration_date) {
                alert('Please fill in all required fields for each food item');
                return;
            }
            
            // Add photo if exists
            const photoInput = item.querySelector('input[type="file"]');
            if (photoInput && photoInput.files.length > 0) {
                const resizedPhoto = await resizeImage(photoInput.files[0]);
                foodItem.photo = resizedPhoto;
            }
            
            formData.food_items.push(foodItem);
        }
        
        const response = await fetch('/submit-donation/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                donation_data: JSON.stringify(formData)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Donation submitted successfully! Your donation number is ${data.donation_no}`);
            window.location.reload();
        } else {
            alert(data.error || 'Failed to submit donation');
        }
    } catch (error) {
        console.error('Error details:', error);
        alert('An error occurred while submitting your donation');
    }
}

// Helper function to get base64 from file
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Helper function to get CSRF token
function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Add this helper function for image resizing
async function resizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Max dimensions
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with reduced quality
                const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
                resolve(resizedImage);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Make functions globally available
window.addFoodItem = addFoodItem;
window.previewImage = previewImage;
window.removeImage = removeImage;
window.toggleDeliveryOptions = toggleDeliveryOptions;
window.handleSubmit = handleSubmit; 