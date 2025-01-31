function validateForm(event) {
    event.preventDefault(); // Prevent form submission for validation
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let usernameError = document.getElementById("username-error");
    let passwordError = document.getElementById("password-error");

    usernameError.textContent = "";
    passwordError.textContent = "";

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
    if (password.length < 6 || password.length > 12) {
        passwordError.textContent = "Password must be between 6 and 12 characters.";
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        passwordError.textContent = "Password must contain at least one uppercase letter.";
        isValid = false;
    } else if (!/[0-9]/.test(password)) {
        passwordError.textContent = "Password must contain at least one number.";
        isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        passwordError.textContent = "Password must contain at least one special character.";
        isValid = false;
    } else if (/\s/.test(password)) {
        passwordError.textContent = "Password must not contain spaces.";
        isValid = false;
    }

    if (isValid) {
        alert("Login successful!");
        document.getElementById("login-form").reset();
    }
}

function resetForm() {
    document.getElementById("login-form").reset();
    document.getElementById("username-error").textContent = "";
    document.getElementById("password-error").textContent = "";
}