function validateForm(event) {
    event.preventDefault(); // Prevent form submission for validation
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirm-password").value;
    let firstName = document.getElementById("first-name").value;
    let lastName = document.getElementById("last-name").value;
    let email = document.getElementById("email").value;

    let usernameError = document.getElementById("username-error");
    let passwordError = document.getElementById("password-error");
    let confirmPasswordError = document.getElementById("confirm-password-error");
    let firstNameError = document.getElementById("first-name-error");
    let lastNameError = document.getElementById("last-name-error");
    let emailError = document.getElementById("email-error");

    usernameError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    firstNameError.textContent = "";
    lastNameError.textContent = "";
    emailError.textContent = "";

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

    // Confirm Password validation
    if (confirmPassword !== password) {
        confirmPasswordError.textContent = "Passwords do not match.";
        isValid = false;
    }

    // First Name validation
    if (firstName.length < 2) {
        firstNameError.textContent = "First name must be at least 2 characters long.";
        isValid = false;
    }

    // Last Name validation
    if (lastName.length < 2) {
        lastNameError.textContent = "Last name must be at least 2 characters long.";
        isValid = false;
    }

    // Email validation
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
        emailError.textContent = "Invalid email format.";
        isValid = false;
    }

    if (isValid) {
        alert("Form submitted successfully!");
        document.getElementById("login-form").reset();
    }
}

function resetForm() {
    document.getElementById("login-form").reset();
    document.getElementById("username-error").textContent = "";
    document.getElementById("password-error").textContent = "";
    document.getElementById("confirm-password-error").textContent = "";
    document.getElementById("first-name-error").textContent = "";
    document.getElementById("last-name-error").textContent = "";
    document.getElementById("email-error").textContent = "";
}
function showPassword(){
    var password = document.getElementById("password");
    var confirmPassword = document.getElementById("confirm-password");
    if (password.type === "password") {
        password.type = "text";
        confirmPassword.type = "text";
    } else {
        password.type = "password";
        confirmPassword.type = "password";
    }
}