document.addEventListener('DOMContentLoaded', function() {

  // Check if user exists in localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const rightSection = document.querySelector(".right-section");

  if (!user) {
    // User is not logged in
    rightSection.innerHTML = `
      <h2>Please log in first.</h2>
      <p>You must be logged in to submit a contact form. <a href="login.html">Log in here</a>.</p>
    `;
    return; // Stop further execution
  }

  document
    .getElementById("contactForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
  
      const errorMessage = document.getElementById("errorMessage");
      errorMessage.innerHTML = "";
  
      const firstName = document.getElementById("firstName");
      const lastName = document.getElementById("lastName");
      const phone = document.getElementById("phone");
      const email = document.getElementById("email");
      const comment = document.getElementById("comment").value.trim();
      const gender = document.querySelector('input[name="gender"]:checked');
  
      const nameRegex = /^[A-Z][a-zA-Z]*$/;
      const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;

      let isValid = true;

      // Validate First Name
      if (!nameRegex.test(firstName.value.trim())) {
        firstName.classList.add("error");
        errorMessage.innerHTML +=
          "First name must start with a capital letter and contain only alphabets.<br>";
        isValid = false;
      } else {
        firstName.classList.remove("error");
      }
  
      // Validate Last Name
      if (!nameRegex.test(lastName.value.trim())) {
        lastName.classList.add("error");
        errorMessage.innerHTML +=
          "Last name must start with a capital letter and contain only alphabets.<br>";
        isValid = false;
      } else {
        lastName.classList.remove("error");
      }
  
      // Check if First Name and Last Name are the same
      if (firstName.value.trim() === lastName.value.trim()) {
        errorMessage.innerHTML +=
          "First name and last name cannot be the same.<br>";
        firstName.classList.add("error");
        lastName.classList.add("error");
        isValid = false;
      }
  
      // Validate Phone Number
      if (!phoneRegex.test(phone.value.trim())) {
        phone.classList.add("error");
        errorMessage.innerHTML +=
          "Phone number must be in the format (ddd) ddd-dddd.<br>";
        isValid = false;
      } else {
        phone.classList.remove("error");
      }
  
      // Validate Email
      if (!emailRegex.test(email.value.trim())) {
        email.classList.add("error");
        errorMessage.innerHTML +=
          'Email address must contain "@" and a valid domain.<br>';
        isValid = false;
      } else {
        email.classList.remove("error");
      }
  
      // Validate Gender Selection
      if (!gender) {
        // Show error message if gender is not selected
        errorMessage.innerHTML += "Please select a gender.<br>";
        isValid = false;
      }
  
      // Validate Comment Length
      if (comment.length < 10) {
        document.getElementById("comment").classList.add("error");
        errorMessage.innerHTML +=
          "Comment must be at least 10 characters long.<br>";
        isValid = false;
      } else {
        document.getElementById("comment").classList.remove("error");
      }
  
      // If all inputs are valid
      if (isValid) {
        const userData = {
          firstName: firstName.value.trim(), // Extract value
          lastName: lastName.value.trim(), // Extract value
          phone: phone.value.trim(), // Extract value
          email: email.value.trim(), // Extract value
          gender: gender ? gender.value : '', // Extract value, ensure it's a string
          comment: comment // Already trimmed
        };

        // Send the data to the server
        fetch('http://localhost:3000/create-xml', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showNotification(data.message);
            document.getElementById("contactForm").reset();
        })
        .catch((error) => {
            errorMessage.innerHTML += 'Error submitting form: ' + error.message + '<br>';
        });
      }
    });
  
  function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
  
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
  
  document.getElementById("phone").addEventListener("input", function (event) {
    let input = event.target.value;
    input = input.replace(/\D/g, "");
  
    if (input.length > 3 && input.length <= 6) {
      input = `(${input.slice(0, 3)}) ${input.slice(3)}`;
    } else if (input.length > 6) {
      input = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6, 10)}`;
    }
  
    event.target.value = input;
  });
})