// Authentication related JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Modal elements
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const closeBtns = document.querySelectorAll(".close");
  const switchToSignup = document.getElementById("switchToSignup");
  const switchToLogin = document.getElementById("switchToLogin");

  // Show modal function
  function showModal(modal) {
    if (!modal) return;
    modal.style.display = "block";
    document.body.style.overflow = 'hidden';
    
    // Add show class for animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

    // Focus first input
    const firstInput = modal.querySelector('input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 300);
    }
  }

  // Hide modal function
  function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }

  // Modal controls
  loginBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    showModal(loginModal);
  });

  signupBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    showModal(signupModal);
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest('.modal');
      hideModal(modal);
      // Reset forms when closing modals
      loginForm?.reset();
      signupForm?.reset();
      // Re-enable submit buttons
      enableSubmitButtons();
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      hideModal(e.target);
      // Reset forms when closing modals
      loginForm?.reset();
      signupForm?.reset();
      // Re-enable submit buttons
      enableSubmitButtons();
    }
  });

  // Switch between modals
  switchToSignup?.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal(loginModal);
    setTimeout(() => showModal(signupModal), 300);
    // Reset forms when switching
    loginForm?.reset();
    signupForm?.reset();
    // Re-enable submit buttons
    enableSubmitButtons();
  });

  switchToLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal(signupModal);
    setTimeout(() => showModal(loginModal), 300);
    // Reset forms when switching
    loginForm?.reset();
    signupForm?.reset();
    // Re-enable submit buttons
    enableSubmitButtons();
  });

  // Close modals on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const visibleModal = document.querySelector('.modal[style*="display: block"]');
      if (visibleModal) {
        hideModal(visibleModal);
        // Reset forms
        loginForm?.reset();
        signupForm?.reset();
        // Re-enable submit buttons
        enableSubmitButtons();
      }
    }
  });

  // Get CSRF token
  function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
  }

  // Form submissions
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  function enableSubmitButtons() {
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
      button.disabled = false;
      button.style.opacity = '1';
    });
  }

  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('loading');
    } else {
      button.classList.remove('loading');
    }
  }

  function showError(message, form) {
    if (!message) return;
    
    const formId = form.id;
    const errorContainer = document.getElementById(formId === 'loginForm' ? 'loginMessage' : 'signupMessage');
    if (!errorContainer) return;

    const errorMessage = errorContainer.querySelector('.error-message');
    if (!errorMessage) return;
    
    // Update the message
    errorMessage.textContent = message;
    
    // Add overlay effect to modal content
    const modalContent = form.closest('.modal-content');
    if (modalContent) {
        modalContent.classList.add('has-error');
    }
    
    // Show the error container with animation
    errorContainer.classList.add('show');
    
    // Auto-hide error after 5 seconds
    const hideTimeout = errorContainer.dataset.hideTimeout;
    if (hideTimeout) {
        clearTimeout(parseInt(hideTimeout));
    }
    
    const timeout = setTimeout(() => {
        hideError(errorContainer);
    }, 5000);
    
    errorContainer.dataset.hideTimeout = timeout;
  }

  function hideError(errorContainer) {
    if (!errorContainer) return;
    
    // Clear any existing hide timeout
    const hideTimeout = errorContainer.dataset.hideTimeout;
    if (hideTimeout) {
        clearTimeout(parseInt(hideTimeout));
        delete errorContainer.dataset.hideTimeout;
    }
    
    // Remove the overlay effect from modal content
    const modalContent = errorContainer.closest('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('has-error');
    }
    
    errorContainer.classList.remove('show');
  }

  function clearError(form) {
    if (!form) return;
    
    const formId = form.id;
    const errorContainer = document.getElementById(formId === 'loginForm' ? 'loginMessage' : 'signupMessage');
    
    if (errorContainer) {
        hideError(errorContainer);
        const errorMessage = errorContainer.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.textContent = '';
        }
    }
    
    // Remove overlay effect from modal content
    const modalContent = form.closest('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('has-error');
    }
    
    // Clear field-level errors
    form.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
    });
  }

  // Field validation functions
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePassword(password) {
    return password.length >= 8;
  }

  function validateUsername(username) {
    return username.length >= 3;
  }

  function showFieldError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return; // Guard clause for null formGroup
    
    formGroup.classList.add('error');
    const errorText = formGroup.querySelector('.error-text');
    if (errorText) {
      errorText.textContent = message;
    }
  }

  function clearFieldError(input) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return; // Guard clause for null formGroup
    
    formGroup.classList.remove('error');
  }

  // Add click handler for error close buttons
  document.querySelectorAll('.error-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const container = this.closest('.error-container');
      if (container) {
        hideError(container);
      }
    });
  });

  // Add escape key handler to close error messages
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.error-container.show').forEach(container => {
        hideError(container);
      });
    }
  });

  // Prevent clicks on error container from bubbling and closing modal
  document.querySelectorAll('.error-container').forEach(container => {
    container.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });

  // Real-time validation for login form
  if (loginForm) {
    const loginEmail = loginForm.querySelector('#loginEmail');
    const loginPassword = loginForm.querySelector('#loginPassword');

    loginEmail.addEventListener('input', function() {
      if (this.value) {
        if (!validateEmail(this.value)) {
          showFieldError(this, 'Please enter a valid email address');
        } else {
          clearFieldError(this);
        }
      } else {
        clearFieldError(this);
      }
    });

    loginPassword.addEventListener('input', function() {
      if (this.value && this.value.length < 8) {
        showFieldError(this, 'Password must be at least 8 characters');
      } else {
        clearFieldError(this);
      }
    });
  }

  // Add debounce function for input validation
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Password strength validation
  function validatePasswordStrength(password) {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    const strength = Object.values(requirements).filter(Boolean).length;
    return { requirements, strength };
  }

  // Update password strength UI
  function updatePasswordStrength(password) {
    const strengthMeter = document.querySelector('.password-strength-meter');
    const requirementsList = document.querySelector('.password-requirements');
    const { requirements, strength } = validatePasswordStrength(password);

    // Update strength bar
    strengthMeter.className = 'password-strength-meter';
    if (strength > 0) {
      strengthMeter.classList.add(
        strength <= 2 ? 'strength-weak' : 
        strength <= 4 ? 'strength-medium' : 
        'strength-strong'
      );
    }

    // Show requirements list when password field is focused
    requirementsList.classList.add('show');

    // Update requirements list
    Object.entries(requirements).forEach(([requirement, isValid]) => {
      const li = requirementsList.querySelector(`[data-requirement="${requirement}"]`);
      if (li) {
        li.classList.toggle('valid', isValid);
      }
    });

    return strength === 5; // Return true if all requirements are met
  }

  // Enhanced email validation
  function validateEmail(email) {
    // RFC 5322 compliant email regex
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
  }

  // Add loading state to button
  function setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle('loading', isLoading);
  }

  // Retry mechanism for failed requests
  async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
  }

  // Update form validation
  if (signupForm) {
    const passwordInput = signupForm.querySelector('#signupPassword');
    const confirmPasswordInput = signupForm.querySelector('#confirmPassword');
    const emailInput = signupForm.querySelector('#signupEmail');

    // Debounced input validation
    const debouncedPasswordValidation = debounce((value) => {
      const isValid = updatePasswordStrength(value);
      const formGroup = passwordInput.closest('.form-group');
      formGroup.classList.toggle('error', !isValid);
    }, 300);

    const debouncedEmailValidation = debounce((value) => {
      const isValid = validateEmail(value);
      const formGroup = emailInput.closest('.form-group');
      formGroup.classList.toggle('error', value && !isValid);
    }, 300);

    passwordInput.addEventListener('input', (e) => {
      debouncedPasswordValidation(e.target.value);
    });

    emailInput.addEventListener('input', (e) => {
      debouncedEmailValidation(e.target.value);
    });

    confirmPasswordInput.addEventListener('input', (e) => {
      const formGroup = confirmPasswordInput.closest('.form-group');
      formGroup.classList.toggle('error', 
        e.target.value && e.target.value !== passwordInput.value
      );
    });

    // Focus/blur handlers for password requirements
    passwordInput.addEventListener('focus', () => {
      document.querySelector('.password-requirements').classList.add('show');
    });

    passwordInput.addEventListener('blur', () => {
      if (!passwordInput.value) {
        document.querySelector('.password-requirements').classList.remove('show');
      }
    });
  }

  // Signup form submission
  signupForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const submitButton = this.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;

    clearError(this);
    let hasErrors = false;

    // Get form values
    const username = this.querySelector('#signupUsername').value;
    const email = this.querySelector('#signupEmail').value;
    const password = this.querySelector('#signupPassword').value;
    const confirmPassword = this.querySelector('#confirmPassword').value;
    const terms = this.querySelector('#terms').checked;

    // Validation checks
    if (!username || username.length < 3) {
        showFieldError(this.querySelector('#signupUsername'), 
            'Username must be at least 3 characters');
        hasErrors = true;
    }

    if (!email || !validateEmail(email)) {
        showFieldError(this.querySelector('#signupEmail'), 
            'Please enter a valid email address');
        hasErrors = true;
    }

    if (!password || !validatePasswordStrength(password).requirements.length) {
        showFieldError(this.querySelector('#signupPassword'), 
            'Password must meet all requirements');
        hasErrors = true;
    }

    if (!confirmPassword || confirmPassword !== password) {
        showFieldError(this.querySelector('#confirmPassword'), 
            'Passwords do not match');
        hasErrors = true;
    }

    if (!terms) {
        showFieldError(this.querySelector('#terms'), 
            'You must agree to the Terms & Conditions');
        hasErrors = true;
    }

    if (hasErrors) {
        showError('Please correct the errors above', this);
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('confirmPassword', confirmPassword);
        formData.append('csrfmiddlewaretoken', getCSRFToken());

        const response = await fetch('/signup/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            body: formData
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            // Clear the form
            this.reset();
            // Hide signup modal
            hideModal(document.getElementById('signupModal'));
            // Show success modal
            showRegistrationSuccess(data.message);
        } else {
            // Show error message in the modal
            showError(data.error || 'An error occurred during registration', this);
            
            // If it's a password-related error, clear password fields
            if (data.error && data.error.toLowerCase().includes('password')) {
                this.querySelector('#signupPassword').value = '';
                this.querySelector('#confirmPassword').value = '';
                this.querySelector('#signupPassword').focus();
            }
            
            // If it's a username error, focus username field
            if (data.error && data.error.toLowerCase().includes('username')) {
                this.querySelector('#signupUsername').focus();
            }
            
            // If it's an email error, focus email field
            if (data.error && data.error.toLowerCase().includes('email')) {
                this.querySelector('#signupEmail').focus();
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred. Please try again later.', this);
    } finally {
        setButtonLoading(submitButton, false);
    }
  });

  // Update the registration success function
  function showRegistrationSuccess(message) {
    const successModal = document.getElementById('registrationSuccessModal');
    if (!successModal) return;
    
    // Update success message if provided
    const successMessage = successModal.querySelector('.success-message');
    if (successMessage && message) {
        successMessage.textContent = message;
    }
    
    // Show the modal
    successModal.style.display = 'block';
    
    // Get elements
    const loadingSpinner = successModal.querySelector('.loading-spinner');
    const successContent = successModal.querySelector('.success-content');
    
    // Initially show loading, hide success content
    loadingSpinner.style.display = 'flex';
    successContent.style.display = 'none';
    
    // After loading animation, show success content
    setTimeout(() => {
        loadingSpinner.style.display = 'none';
        successContent.style.display = 'block';
        successContent.classList.add('fade-in');
    }, 2000); // Show loading for 2 seconds
  }

  // Add event listener for success modal login link
  document.getElementById('successModalLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registrationSuccessModal').style.display = 'none';
    loginModal.style.display = 'block';
  });

  // Add this to your existing logout handling code
  document.querySelector(".logout")?.addEventListener("click", function () {
    console.log('Logout clicked');
    console.log('Before clearing localStorage:', localStorage.getItem('currentSection'));
    localStorage.removeItem("currentSection");
    console.log('After clearing localStorage:', localStorage.getItem('currentSection'));
  });

  // Clean up function
  function cleanup() {
    // Remove all event listeners when the modal is destroyed
    const forms = [loginForm, signupForm];
    forms.forEach(form => {
      if (form) {
        form.removeEventListener('submit', form._submitHandler);
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
          input.removeEventListener('input', input._inputHandler);
          input.removeEventListener('focus', input._focusHandler);
          input.removeEventListener('blur', input._blurHandler);
        });
      }
    });
  }

  // Add cleanup to window unload
  window.addEventListener('unload', cleanup);

  // Login form submission
  loginForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const submitButton = this.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;

    clearError(this);
    let hasErrors = false;

    // Get form values
    const email = this.querySelector('#loginEmail').value;
    const password = this.querySelector('#loginPassword').value;

    // Basic validation
    if (!email || !validateEmail(email)) {
        showFieldError(this.querySelector('#loginEmail'), 'Please enter a valid email address');
        hasErrors = true;
    }

    if (!password) {
        showFieldError(this.querySelector('#loginPassword'), 'Please enter your password');
        hasErrors = true;
    }

    if (hasErrors) {
        showError('Please correct the errors above', this);
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('csrfmiddlewaretoken', getCSRFToken());

        const response = await fetch('/login/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            body: formData
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            // Successful login - redirect
            window.location.href = data.redirect;
        } else {
            // Show error message in the modal
            showError(data.error || 'An error occurred during login', this);
            // Clear password field on error
            this.querySelector('#loginPassword').value = '';
            // Focus password field
            this.querySelector('#loginPassword').focus();
        }
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred. Please try again later.', this);
    } finally {
        setButtonLoading(submitButton, false);
    }
  });
});
