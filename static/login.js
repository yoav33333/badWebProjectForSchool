function validateForm() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let usernameError = document.getElementById("username-error");
    let passwordError = document.getElementById("password-error");


    let isValid = true;

    // Username validation
    if (!/^[A-Za-z0-9]+$/.test(username)) {
        usernameError.textContent = "Username can contain only letters and numbers, no spaces.";
        isValid = false;
    } else if (username.length < 4) { // Set your minimum length here
        usernameError.textContent = "Username must be at least 4 characters long.";
        isValid = false;
    }

    // Password validation
    if (password.length <= 6 || password.length >= 12) {
        passwordError.textContent = "Password must be between 6 and 12 characters.";
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        passwordError.textContent = "Password must contain at least one uppercase letter.";
        isValid = false;
    } else if (!/[0-9]/.test(password)) {
        passwordError.textContent = "Password must contain at least one number.";
        isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>+]/.test(password)) {
        passwordError.textContent = "Password must contain at least one special character.";
        isValid = false;
    } else if (/\s/.test(password)) {
        passwordError.textContent = "Password must not contain spaces.";
        isValid = false;
    }
    if (!isValid) {
        // document.getElementById("login-form").reset();
        event.preventDefault();
    }

}

function resetForm() {
    document.getElementById("login-form").reset();
    document.getElementById("username-error").textContent = "";
    document.getElementById("password-error").textContent = "";
}
// login.js

// Assumed existing function to validate the form
function validateForm() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Basic validation
    if (username === "") {
        alert("Please enter your username or email.");
        return false;
    }

    if (password === "") {
        alert("Please enter your password.");
        return false;
    }

    console.log("Validation successful!");
    return true;
}

// Additional functionality for "Show Password"
document.addEventListener("DOMContentLoaded", function () {
    const passwordInput = document.getElementById("password");
    const showPasswordBtn = document.getElementById("showPasswordBtn");

    // Toggling password visibility
    showPasswordBtn.addEventListener("click", function () {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            showPasswordBtn.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            showPasswordBtn.textContent = "Show";
        }
    });

    // You don’t need to add custom functionality for `reset` since the browser handles it.
    // However, if you want custom behaviors (e.g., clearing error messages), you can add it below:
    const resetButton = document.querySelector('button[type="reset"]');
    resetButton.addEventListener("click", function () {
        console.log("Reset button clicked");
        // You can reset custom validation errors or styling here if necessary
    });
});