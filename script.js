function updateTime() {
  const timeElement = document.getElementById('current-time');
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'});
  timeElement.textContent = "Current Time: " + timeString;
}

// Update the time every second
setInterval(updateTime, 1000);