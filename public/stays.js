// -(validations details are in description)
//          -City must be a city in Texas or California
//          -date must be between Sep 1, 2024 to Dec 1st 2024
//          -number of guests cannot be more than 2 for each room. However, infants can stay with adults even if the number of guests exceeds 2  

document.addEventListener("DOMContentLoaded", function () {
    const guestIcon = document.getElementById("guest-icon");
    const guestForm = document.getElementById("guest-form");
    const stayForm = document.getElementById("stayForm");
    const displayInfo = document.getElementById("displayInfo");
    const errorMessage = document.getElementById("errorMessage");
  
    // Initially hide the displayInfo section
    displayInfo.classList.add("hidden");
  
    // Toggle passenger form visibility
    guestIcon.addEventListener("click", function () {
      guestForm.style.display =
        guestForm.style.display === "none" ? "block" : "none";
    });
  
    // Handle form submission
    stayForm.addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent form submission
    
      const cityName = document.getElementById("city-name").value.trim();
      const checkinDate = document.getElementById("checkin").value;
      const checkoutDate = document.getElementById("checkout").value;
      const numberOfRooms = document.getElementById("rooms").value || 0;
      const adults = parseInt(document.getElementById("adults").value) || 0;
      const children = parseInt(document.getElementById("children").value) || 0;
      const infants = parseInt(document.getElementById("infants").value) || 0;
  
      // Clear previous error messages
      errorMessage.innerHTML = "";
      displayInfo.classList.add("hidden");
  
      const messages = []; // Collect error messages
      
      // Validate inputs
      const isValidDate = (date) => {
        const startDate = new Date("2024-09-01");
        const endDate = new Date("2024-12-01");
        return date >= startDate && date <= endDate;
    };
      
    const isValidLocation = (location) => {
        const validLocations = {
            Texas: [
                "Abilene", "Amarillo", "Austin", "Beaumont", "Brownsville", "Carrollton", 
                "College Station", "Dallas", "Denton", "El Paso", "Fort Worth", "Frisco", 
                "Garland", "Grand Prairie", "Houston", "Irving", "Laredo", "Lewisville", 
                "McKinney", "Mesquite", "Midland", "Odessa", "Pasadena", "Round Rock", 
                "San Angelo", "San Antonio", "San Marcos", "Sugar Land", "Tyler", 
                "Wichita Falls"
            ],
            California: [
                "Alameda", "Anaheim", "Bakersfield", "Chula Vista", "Concord", "Corona", 
                "Daly City", "El Monte", "Fresno", "Fullerton", "Glendale", "Hayward", 
                "Huntington Beach", "Irvine", "Lancaster", "Long Beach", "Los Angeles", 
                "Modesto", "Oakland", "Ontario", "Orange", "Riverside", "Sacramento", 
                "San Bernardino", "San Diego", "San Francisco", "San Jose", "Santa Ana", 
                "Santa Clara", "Santa Monica", "Stockton", "Torrance", "Visalia", "Woodland"
            ],
        };
        
        // Convert location to lowercase
        const lowerCaseLocation = location.toLowerCase();
        
        // Check for inclusion in valid locations
        return validLocations.Texas.some(city => city.toLowerCase() === lowerCaseLocation) || 
        validLocations.California.some(city => city.toLowerCase() === lowerCaseLocation);
    };    
  
    // Check if inputs are valid
    if (!cityName) {
        messages.push("City name is required.");
    } else if (!isValidLocation(cityName)) {
        messages.push("The city must be in Texas or California.");
    }

    const checkin = new Date(checkinDate + "T12:00:00"); // Set to noon
    if (!isValidDate(checkin)) {
        messages.push("Check-in date must be between September 1, 2024, and December 1, 2024.");
    }

    const checkout = new Date(checkoutDate + "T12:00:00"); // Set to noon
    if (!isValidDate(checkout)) {
        messages.push("Check-out date must be between September 1, 2024, and December 1, 2024.");
    }

    if (checkin >= checkout) {
        messages.push("Check-out date must come after your check-in date.");
    }

    const totalGuests = adults + children;
    const roomsNeeded = Math.ceil(totalGuests / 2);
    if (roomsNeeded > numberOfRooms) {
        messages.push(`You need at least ${roomsNeeded} room(s) for ${totalGuests} guests.`);
    }
  
    // Show error messages if any
    if (messages.length > 0) {
        errorMessage.innerHTML = messages.join("<br>");
        displayInfo.classList.add("hidden"); // Hide displayInfo if inputs are invalid
        return; // Stop execution if validation fails
    }

    // If all inputs are valid, display the information
    errorMessage.textContent = ""; // Clear any previous error messages
    displayInfo.innerHTML = `
    <h3>Your Stay Booking Information</h3>
    <p>City Name: ${cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase()}</p>
    <p>Check-in Date: ${new Date(checkinDate).toDateString()}</p>
    <p>Check-out Date: ${new Date(checkoutDate).toDateString()}</p>
    <p>Number of guests:</p>
    <p>Adults: ${adults}</p>
    <p>Children: ${children}</p>
    <p>Infants: ${infants}</p>
    <p>Number of rooms: ${numberOfRooms}</p>
    `;
  
    // Show the displayInfo section after valid input
    displayInfo.classList.remove("hidden");

    });
});