document.addEventListener("DOMContentLoaded", function () {
  // Function to update the time
  function updateTime() {
    const timeElement = document.getElementById("current-time");
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const dateString = now.toLocaleDateString([], {
      year: "numeric",
      month: "long", // 'short' or 'numeric' for different formats
      day: "2-digit",
    });
    timeElement.textContent = `Current Date: ${dateString}, Time: ${timeString}`;
  }

  // Function to display the user's name
  function displayUserName() {
    const userNameDisplay = document.getElementById("user-name-display");

    // Check if user exists in localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      // Display the user's name
      userNameDisplay.textContent = `Welcome, ${user.firstName} ${user.lastName}!`;
    } else {
      // If no user is logged in, clear the name display
      userNameDisplay.textContent = "";
    }
  }

  // Call both functions
  displayUserName();
  updateTime();

  // Update the time every second
  setInterval(updateTime, 1000);
});
