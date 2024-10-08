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

    // If all inputs are valid, show notification
    if (isValid) {
      showNotification('Form submitted successfully!');
      document.getElementById("contactForm").reset();
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