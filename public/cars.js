// (check problem for validation requirements)
// -the user must enter check in date and check out date between sep 1st 2024 to dec 1st 2024
// -the type of car can be economy, SUB, compact or midsize

document.addEventListener("DOMContentLoaded", function () {
    const carType = document.getElementById("car-type");
    const carForm = document.getElementById("carForm");
    const displayInfo = document.getElementById("displayInfo");
    const errorMessage = document.getElementById("errorMessage");
  
    // Initially hide the displayInfo section
    displayInfo.classList.add("hidden");
  
    // Handle form submission
    carForm.addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent form submission
    
      const cityName = document.getElementById("city-name").value.trim();
      const checkinDate = document.getElementById("checkin").value;
      const checkoutDate = document.getElementById("checkout").value;
  
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
  
    // Show error messages if any
    if (messages.length > 0) {
        errorMessage.innerHTML = messages.join("<br>");
        displayInfo.classList.add("hidden"); // Hide displayInfo if inputs are invalid
        return; // Stop execution if validation fails
    }

    // If all inputs are valid, display the information
    errorMessage.textContent = ""; // Clear any previous error messages
    displayInfo.innerHTML = `
    <h3>Your Car Booking Information</h3>
    <p>City Name: ${cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase()}</p>
    <p>Check-in Date: ${new Date(checkinDate).toDateString()}</p>
    <p>Check-out Date: ${new Date(checkoutDate).toDateString()}</p>
    <p>Car Type: ${carType.options[carType.selectedIndex].text} </p>
    `;
  
    // Show the displayInfo section after valid input
    displayInfo.classList.remove("hidden");

    });
});