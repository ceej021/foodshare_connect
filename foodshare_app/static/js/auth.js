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

  // Get CSRF token
  function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
  }

  // Form submissions
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  // Modal controls
  loginBtn?.addEventListener(
    "click",
    () => (loginModal.style.display = "block")
  );
  signupBtn?.addEventListener(
    "click",
    () => (signupModal.style.display = "block")
  );

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      loginModal.style.display = "none";
      signupModal.style.display = "none";
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });

  switchToSignup?.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "none";
    signupModal.style.display = "block";
  });

  switchToLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    signupModal.style.display = "none";
    loginModal.style.display = "block";
  });

  // Form handling
  loginForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log('Login form submitted');

    try {
      const formData = new FormData(this);
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get("next");
      if (nextUrl) {
        formData.append("next", nextUrl);
        console.log('Next URL found:', nextUrl);
      }

      const response = await fetch("/login/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": getCSRFToken(),
        },
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.success) {
        console.log('Before clearing localStorage:', localStorage.getItem('currentSection'));
        localStorage.removeItem("currentSection");
        console.log('After clearing localStorage:', localStorage.getItem('currentSection'));
        console.log('Redirecting to:', data.redirect);
        window.location.href = data.redirect;
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login");
    }
  });

  signupForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const formData = new FormData(this);

      if (!formData.get("terms")) {
        alert("Please agree to the terms and conditions");
        return;
      }

      if (formData.get("password") !== formData.get("confirmPassword")) {
        alert("Passwords do not match!");
        return;
      }

      const response = await fetch("/signup/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": getCSRFToken(),
        },
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = "/donate/";
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred during signup");
    }
  });

  // Add this to your existing logout handling code
  document.querySelector(".logout")?.addEventListener("click", function () {
    console.log('Logout clicked');
    console.log('Before clearing localStorage:', localStorage.getItem('currentSection'));
    localStorage.removeItem("currentSection");
    console.log('After clearing localStorage:', localStorage.getItem('currentSection'));
  });
});
