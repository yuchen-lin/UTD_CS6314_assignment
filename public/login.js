document.getElementById("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("error-message");


  errorMessage.textContent = ""; // Reset error message

  // Validation
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  if (!phoneRegex.test(phone)) {
    errorMessage.textContent = "Phone number must be in the format ddd-ddd-dddd.";
    return;
  }

  if (!password) {
    errorMessage.textContent = "Password is required.";
    return;
  }

  try {
    // Send login request to the server
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save user info in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login successful!");
      window.location.href = "my-account.html"; // Redirect to My Account page
    } else {
      errorMessage.textContent = data.message || "Invalid phone number or password.";
    }
  } catch (error) {
    console.error("Error:", error);
    errorMessage.textContent = "An error occurred. Please try again.";
  }
});

document.getElementById("logoutButton").addEventListener("click", function () {
  // Remove the user data from localStorage
  localStorage.removeItem("user");

  // Optional: Provide feedback to the user
  alert("You have been logged out.");

  // Redirect to the login page (optional if already on the login page)
  window.location.href = "login.html";
});