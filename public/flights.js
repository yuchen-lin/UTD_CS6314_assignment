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
      // Clear return flight selection from localStorage when switching to one-way
      const selectedFlights = JSON.parse(localStorage.getItem("selectedFlights")) || {};
      if (selectedFlights.return) {
        delete selectedFlights.return;
        localStorage.setItem("selectedFlights", JSON.stringify(selectedFlights));
      }
    }
  });

  // Toggle passenger form visibility
  passengerIcon.addEventListener("click", function () {
    passengerForm.style.display =
      passengerForm.style.display === "none" ? "block" : "none";
  });

  // Handle form submission
  flightForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const origin = capitalizeWords(document.getElementById("origin").value.trim());
    const destination = capitalizeWords(document.getElementById("destination").value.trim());
    const departureDateInput = document.getElementById("departure-date").value;
    const returnDateInput = document.getElementById("return-date").value;
    const adults = parseInt(document.getElementById("adults").value) || 0;
    const children = parseInt(document.getElementById("children").value) || 0;
    const infants = parseInt(document.getElementById("infants").value) || 0;
    const isRoundTrip = tripTypeSelect.value === "round-trip";

    // Function to capitalize each word in the input
    function capitalizeWords(input) {
      return input
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    // Clear previous error messages and display
    errorMessage.innerHTML = "";
    displayInfo.classList.add("hidden");

    const messages = [];

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
        ]
      };

      const lowerCaseLocation = location.toLowerCase();
      return (
        validLocations.Texas.some(city => city.toLowerCase() === lowerCaseLocation) ||
        validLocations.California.some(city => city.toLowerCase() === lowerCaseLocation)
      );
    };

    // Validation checks
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

    const departureDate = new Date(departureDateInput + "T12:00:00");
    if (!isValidDate(departureDate)) {
      messages.push("Departure date must be between September 1, 2024, and December 1, 2024.");
    }

    // Only validate return date if it's a round trip
    let returnDate;
    if (isRoundTrip) {
      if (!returnDateInput) {
        messages.push("Return date is required for round-trip flights.");
      } else {
        returnDate = new Date(returnDateInput + "T12:00:00");
        if (!isValidDate(returnDate)) {
          messages.push("Return date must be between September 1, 2024, and December 1, 2024.");
        }
        if (returnDate <= departureDate) {
          messages.push("Return date must be after the departure date.");
        }
      }
    }

    if (messages.length > 0) {
      errorMessage.innerHTML = messages.join("<br>");
      displayInfo.classList.add("hidden");
      return;
    }

    // Display basic flight information
    displayInfo.innerHTML = `
      <h3>Your Flight Information</h3>
      <p>Type of Trip: ${isRoundTrip ? "Round Trip" : "One Way"}</p>
      <p>Origin: ${origin}</p>
      <p>Destination: ${destination}</p>
      <p>Departure Date: ${departureDate.toDateString()}</p>
      ${isRoundTrip ? `<p>Return Date: ${returnDate.toDateString()}</p>` : ""}
      <p>Adults: ${adults}</p>
      <p>Children: ${children}</p>
      <p>Infants: ${infants}</p>
    `;

    displayInfo.classList.remove("hidden");

    try {
      // Search for departure flights
      const departureFlights = await searchFlights(origin, destination, departureDateInput, adults, children, infants);
      displayFlightResults(departureFlights, "Departure Flights", "departure");

      // Only search for return flights if it's a round trip
      if (isRoundTrip) {
        const returnFlights = await searchFlights(destination, origin, returnDateInput, adults, children, infants);
        displayFlightResults(returnFlights, "Return Flights", "return");
      }
    } catch (error) {
      console.error("Error fetching flights:", error);
      errorMessage.innerHTML = "Error fetching flight data.";
    }
  });

  // Function to search for flights
  async function searchFlights(origin, destination, date, adults, children, infants) {
    const response = await fetch("http://localhost:3000/search-flights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin: origin,
        destination: destination,
        departureDate: date,
        adults: adults,
        children: children,
        infants: infants,
      }),
    });
    return response.json();
  }

  // Function to display flight results
  function displayFlightResults(flights, sectionTitle, flightType) {
    if (Array.isArray(flights) && flights.length > 0) {
      let flightInfoHtml = `<br><h3>${sectionTitle}:</h3>`;
      const selectedFlights = JSON.parse(localStorage.getItem("selectedFlights")) || {};
      
      if (!selectedFlights[flightType]) {
        selectedFlights[flightType] = [];
      }

      flights.forEach((flight) => {
        const flightId = flight["flight-id"][0];
        const isSelected = selectedFlights[flightType].some(f => f.flightId === flightId);
        
        flightInfoHtml += `
          <br>
          <p>Flight ID: ${flight["flight-id"][0]}</p>
          <p>Departure Date: ${flight["departure-date"][0]}</p>
          <p>Departure Time: ${flight["departure-time"][0]}</p>
          <p>Arrival Date: ${flight["arrival-date"][0]}</p>
          <p>Arrival Time: ${flight["arrival-time"][0]}</p>
          <p>Available Seats: ${flight["available-seats"][0]}</p>
          <p>Price (per adult): ${flight["price"][0]}</p>
          <button class="select-flight" 
                  data-flight-id="${flight["flight-id"][0]}"
                  data-flight-type="${flightType}">
            ${isSelected ? "Remove from cart" : "Add to cart"}
          </button>
          <hr>
        `;
      });

      displayInfo.innerHTML += flightInfoHtml;

      // Add event listeners for flight selection
      document.querySelectorAll(".select-flight").forEach((button) => {
        button.addEventListener("click", function () {
          const flightId = this.getAttribute("data-flight-id");
          const flightType = this.getAttribute("data-flight-type");
          const selectedFlights = JSON.parse(localStorage.getItem("selectedFlights")) || {};
          
          if (!selectedFlights[flightType]) {
            selectedFlights[flightType] = [];
          }

          const isSelected = selectedFlights[flightType].some(f => f.flightId === flightId);
          
          if (isSelected) {
            // Remove flight from selection
            selectedFlights[flightType] = selectedFlights[flightType].filter(f => f.flightId !== flightId);
            this.innerText = "Add to cart";
          } else {
            // Remove any existing flight of the same type (only one flight per direction)
            selectedFlights[flightType] = [];
            // Add new flight to selection
            selectedFlights[flightType].push({
              flightId,
              adults: parseInt(document.getElementById("adults").value) || 0, // Convert to integer
              children: parseInt(document.getElementById("children").value) || 0, // Convert to integer
              infants: parseInt(document.getElementById("infants").value) || 0 // Convert to integer
            });
            
            this.innerText = "Remove from cart";
            
            // Update other buttons of the same flight type
            document.querySelectorAll(`.select-flight[data-flight-type="${flightType}"]`).forEach(btn => {
              if (btn !== this) {
                btn.innerText = "Add to cart";
              }
            });
          }

          localStorage.setItem("selectedFlights", JSON.stringify(selectedFlights));
        });
      });
    } else {
      displayInfo.innerHTML += `<p>No ${sectionTitle.toLowerCase()} available for the selected criteria.</p>`;
    }
  }
});