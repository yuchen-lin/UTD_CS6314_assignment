document.addEventListener('DOMContentLoaded', function() {
  function updateTime() {
    const timeElement = document.getElementById('current-time');
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const dateString = now.toLocaleDateString([], {
      year: 'numeric', 
      month: 'long',  // 'short' or 'numeric' for different formats
      day: '2-digit'
    });
    timeElement.textContent = `Current Date: ${dateString}, Time: ${timeString}`;
  }

  // Update the time every second
  setInterval(updateTime, 1000);
});