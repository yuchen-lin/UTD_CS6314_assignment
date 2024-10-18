document.addEventListener("DOMContentLoaded", function () {
  const tripTypeSelect = document.getElementById("trip-type");
  const returnFlightSection = document.getElementById("return-flight-section");
  const passengerIcon = document.getElementById("passenger-icon");
  const passengerForm = document.getElementById("passenger-form");
  const flightForm = document.getElementById("flightForm");
  const displayInfo = document.getElementById("displayInfo");
  const errorMessage = document.getElementById("errorMessage");

  // Initially hide the displayInfo section
  displayInfo.classList.add("hidden");

  // Show/hide return flight section based on trip type
  tripTypeSelect.addEventListener("change", function () {
    if (this.value === "round-trip") {
      returnFlightSection.style.display = "block";
    } else {
      returnFlightSection.style.display = "none";
    }
  });

  // Toggle passenger form visibility
  passengerIcon.addEventListener("click", function () {
    passengerForm.style.display =
      passengerForm.style.display === "none" ? "block" : "none";
  });

  // Handle form submission
  flightForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission

    const origin = document.getElementById("origin").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const departureDateInput = document.getElementById("departure-date").value;
    const returnDateInput = document.getElementById("return-date").value;
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
    if (!origin) {
      messages.push("Origin is required.");
    } else if (!isValidLocation(origin)) {
      messages.push("Origin must be a city in Texas or California.");
    }

    if (!destination) {
      messages.push("Destination is required.");
    } else if (!isValidLocation(destination)) {
      messages.push("Destination must be a city in Texas or California.");
    }

    const departureDate = new Date(departureDateInput + "T12:00:00"); // Set to noon
    if (!isValidDate(departureDate)) {
      messages.push("Departure date must be between September 1, 2024, and December 1, 2024.");
    }

    let returnDate;
    if (tripTypeSelect.value === "round-trip" && returnDateInput) {
      returnDate = new Date(returnDateInput + "T12:00:00"); // Set to noon
      if (returnDate <= departureDate) {
        messages.push("Return date must be after the departure date.");
      }
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
      <h3>Your Flight Information</h3>
      <p>Type of Trip: ${tripTypeSelect.value}</p>
      <p>Origin: ${origin}</p>
      <p>Destination: ${destination}</p>
      <p>Departure Date: ${departureDate.toDateString()}</p>
      ${
        tripTypeSelect.value === "round-trip" && returnDate
          ? `<p>Return Date: ${returnDate.toDateString()}</p>`
          : ""
      }
      <p>Adults: ${adults}</p>
      <p>Children: ${children}</p>
      <p>Infants: ${infants}</p>
    `;

    // Show the displayInfo section after valid input
    displayInfo.classList.remove("hidden");
  });
});