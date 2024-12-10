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
      // Reset form state when closing modal
      const form = modal.querySelector('form');
      resetFormState(form);
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      hideModal(e.target);
      // Reset form state when closing modal
      const form = e.target.querySelector('form');
      resetFormState(form);
    }
  });

  // Switch between modals
  switchToSignup?.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal(loginModal);
    setTimeout(() => {
      showModal(signupModal);
      // Reset login form state
      resetFormState(loginForm);
    }, 300);
  });

  switchToLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal(signupModal);
    setTimeout(() => {
      showModal(loginModal);
      // Reset signup form state
      resetFormState(signupForm);
    }, 300);
  });

  // Close modals on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const visibleModal = document.querySelector('.modal[style*="display: block"]');
      if (visibleModal) {
        hideModal(visibleModal);
        // Reset form state
        const form = visibleModal.querySelector('form');
        resetFormState(form);
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

  // Update button loading state
  function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
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
        console.log('Registration response:', data);
        
        if (response.ok && data.success) {
            console.log('Registration successful, clearing form');
            // Clear the form
            this.reset();
            
            console.log('Hiding signup modal');
            // Hide signup modal
            hideModal(document.getElementById('signupModal'));
            
            console.log('Showing registration success modal');
            // Show success modal
            showRegistrationSuccess(data.message);
        } else {
            console.error('Registration error:', data.error);
            // Show error message in the modal
            showError(data.error || 'An error occurred during registration', this);
            
            // If it's a password-related error, clear password fields
            if (data.error && data.error.toLowerCase().includes('password')) {
                console.log('Password error detected, clearing password fields');
                this.querySelector('#signupPassword').value = '';
                this.querySelector('#confirmPassword').value = '';
                this.querySelector('#signupPassword').focus();
            }
            
            // If it's a username error, focus username field
            if (data.error && data.error.toLowerCase().includes('username')) {
                console.log('Username error detected, focusing username field');
                this.querySelector('#signupUsername').focus();
            }
            
            // If it's an email error, focus email field
            if (data.error && data.error.toLowerCase().includes('email')) {
                console.log('Email error detected, focusing email field');
                this.querySelector('#signupEmail').focus();
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred. Please try again later.', this);
    } finally {
        console.log('Registration process completed');
        setButtonLoading(submitButton, false);
    }
  });

  // Update the registration success function
  function showRegistrationSuccess(message) {
    // Reset signup form state before showing success
    resetFormState(document.getElementById('signupForm'));
    
    const successModal = document.getElementById('registrationSuccessModal');
    if (!successModal) {
        console.error('Registration success modal not found');
        return;
    }
    
    // Rest of the existing success modal code...
    const successMessage = successModal.querySelector('.success-message');
    if (successMessage && message) {
        successMessage.textContent = message;
    }
    
    successModal.style.display = 'block';
    successModal.classList.add('show');
    document.body.style.overflow = 'hidden';
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

  // Add this function to reset form state completely
  function resetFormState(form) {
    if (!form) return;
    
    // Reset the form fields
    form.reset();
    
    // Remove error classes from form groups
    form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    
    // Hide all error messages
    form.querySelectorAll('.error-text').forEach(error => {
        error.style.display = 'none';
    });
    
    // Reset password requirements if it's the signup form
    if (form.id === 'signupForm') {
        // Reset password requirement indicators
        form.querySelectorAll('.password-requirement').forEach(req => {
            req.classList.remove('met', 'not-met');
            // Reset the checkmark/x icons
            const icon = req.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-times';
                icon.style.color = '#dc2626';
            }
        });

        // Hide the password requirements container
        const requirementsContainer = form.querySelector('.password-requirements');
        if (requirementsContainer) {
            requirementsContainer.style.display = 'none';
        }

        // Reset password strength meter if it exists
        const strengthMeter = form.querySelector('.password-strength-meter');
        if (strengthMeter) {
            const strengthBar = strengthMeter.querySelector('.strength-bar');
            if (strengthBar) {
                strengthBar.style.width = '0';
                strengthBar.style.backgroundColor = '#e5e7eb';
            }
            strengthMeter.className = 'password-strength-meter';
        }
    }
    
    // Hide error containers
    const formId = form.id === 'loginForm' ? 'loginMessage' : 'signupMessage';
    const errorContainer = document.getElementById(formId);
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
    
    // Re-enable submit button
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
    }
  }

  // Add password field focus/blur handlers
  const passwordField = document.getElementById('signupPassword');
  if (passwordField) {
    // Show requirements on focus
    passwordField.addEventListener('focus', function() {
      const requirementsContainer = this.closest('form').querySelector('.password-requirements');
      if (requirementsContainer) {
        requirementsContainer.style.display = 'block';
      }
    });

    // Hide requirements on blur if field is empty
    passwordField.addEventListener('blur', function() {
      if (!this.value) {
        const requirementsContainer = this.closest('form').querySelector('.password-requirements');
        if (requirementsContainer) {
          requirementsContainer.style.display = 'none';
        }
      }
    });
  }
});
