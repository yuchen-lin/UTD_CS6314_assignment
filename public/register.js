document.getElementById("registerForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  // Collect form values
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const dob = document.getElementById("dob").value.trim();
  const email = document.getElementById("email").value.trim();
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";

  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = ""; // Reset error message

  // Validation Rules
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;

  // Client-side Validation
  if (!phone || !password || !firstName || !lastName || !dob || !email) {
    errorMessage.textContent = "All fields except gender are required.";
    return;
  }

  if (!phoneRegex.test(phone)) {
    errorMessage.textContent = "Phone number must be in the format ddd-ddd-dddd.";
    return;
  }

  if (password.length < 8) {
    errorMessage.textContent = "Password must be at least 8 characters long.";
    return;
  }

  if (password !== confirmPassword) {
    errorMessage.textContent = "Passwords do not match.";
    return;
  }

  if (!dobRegex.test(dob)) {
    errorMessage.textContent = "Date of Birth must be in MM/DD/YYYY format.";
    return;
  }

  if (!email.includes("@") || !email.endsWith(".com")) {
    errorMessage.textContent = "Email must contain '@' and end with '.com'.";
    return;
  }

  try {
    // Check if the phone number is unique
    const checkResponse = await fetch("http://localhost:3000/check-phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const checkData = await checkResponse.json();
    if (!checkData.isUnique) {
      errorMessage.textContent = "Phone number is already in use.";
      return;
    }

    // If phone number is unique, proceed with registration
    const formData = { phone, password, firstName, lastName, dob, email, gender };

    const registerResponse = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const registerData = await registerResponse.json();
    if (registerData.message === "Registration successful!") {
      alert(registerData.message);
      window.location.href = "login.html"; // Redirect to login page
    } else {
      errorMessage.textContent = registerData.message;
    }
  } catch (error) {
    console.error("Error:", error);
    errorMessage.textContent = "An error occurred. Please try again.";
  }
});
