document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split("/").pop(); // Get the current page filename
  const navLinks = document.querySelectorAll('nav ul li a'); // Select all nav links

  navLinks.forEach(link => {
    // If the link's href matches the current page, add the 'active' class
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  const mainContent = document.querySelector('.right-section');
  const fontSizeSelect = document.getElementById('font-size');
  const bgColorInput = document.getElementById('bg-color');

  // Store original font sizes of all elements
  const originalFontSizes = new Map();

  // Recursive function to store font sizes of all elements
  function storeFontSizes(element) {
    // Get the original font size of the current element
    const fontSize = window.getComputedStyle(element).fontSize;
    originalFontSizes.set(element, fontSize);
    
    // Recursively call for each child element
    const childElements = element.children;
    for (let i = 0; i < childElements.length; i++) {
      storeFontSizes(childElements[i]);
    }
  }

  // Start storing original font sizes from the main content
  storeFontSizes(mainContent);

  // Function to update font sizes based on selected value
  function updateFontSize() {
    const selectedSize = fontSizeSelect.value;
    // Set a more subtle font size for each selection
    const fontSizeMapping = {
      small: '0.9em',  // Slightly smaller
      medium: '1em',   // Original size
      large: '1.1em'   // Slightly larger
    };

    // Reset the font sizes to original for all elements
    const elements = mainContent.querySelectorAll('*'); // Select all child elements
    elements.forEach(element => {
      element.style.fontSize = ''; // Reset font size to original
    });

    // Apply the new font size for all elements
    elements.forEach(element => {
      element.style.fontSize = fontSizeMapping[selectedSize]; // Apply the new font size directly
    });

    // Save the selected font size to localStorage
    localStorage.setItem('fontSize', selectedSize);
  }

  // Function to load settings from localStorage
  function loadSettings() {
    const savedFontSize = localStorage.getItem('fontSize');
    const savedBgColor = localStorage.getItem('bgColor');

    // Apply saved font size if it exists
    if (savedFontSize) {
      fontSizeSelect.value = savedFontSize;
      updateFontSize(); // Update font size to match saved setting
    }

    // Apply saved background color if it exists
    if (savedBgColor) {
      bgColorInput.value = savedBgColor;
      document.body.style.backgroundColor = savedBgColor;
    }
  }

  // Change font size on selection
  fontSizeSelect.addEventListener('change', updateFontSize);

  // Change background color
  bgColorInput.addEventListener('input', function() {
    document.body.style.backgroundColor = this.value;
    // Save the selected background color to localStorage
    localStorage.setItem('bgColor', this.value);
  });

  // Load settings when the page is loaded
  loadSettings();
});
