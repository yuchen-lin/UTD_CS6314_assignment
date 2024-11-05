const flightList = document.getElementById("flight-list");
const selectedFlightsSection = document.getElementById("selected-flights");
const selectedFlights =
  JSON.parse(localStorage.getItem("selectedFlights")) || [];
flightList.innerHTML = ""; // Clear existing list

let totalPrice = 0;
const passengerInputs = document.getElementById("passenger-inputs");

// Check if there are any selected flights
if (selectedFlights.departure.length > 0) {
  // Remove the "hidden" class or set the display style to show the section
  selectedFlightsSection.classList.remove("hidden");
  selectedFlightsSection.style.display = "block";

  // Process each selected flight
  selectedFlights.departure.forEach((data, index) => {
    const { flightId, adults, children, infants } = data;

    // Fetch flight details
    fetch(`http://localhost:3000/get-flight-details?flightId=${flightId}`)
      .then((response) => response.json())
      .then((flight) => {
        // Calculate the price
        const adultPrice = flight.price;
        const childPrice = adultPrice * 0.7;
        const infantPrice = adultPrice * 0.1;
        const flightTotal =
          adults * adultPrice + children * childPrice + infants * infantPrice;
        totalPrice += flightTotal;

        // Create and populate list item with flight details
        const li = document.createElement("li");
        li.innerHTML = `
          <p>Flight ID: ${flight["flight-id"][0]}</p>
          <p>Origin: ${flight.origin}</p>
          <p>Destination: ${flight.destination}</p>
          <p>Departure Date: ${flight["departure-date"][0]}</p>
          <p>Departure Time: ${flight["departure-time"][0]}</p>
          <p>Arrival Date: ${flight["arrival-date"][0]}</p>
          <p>Arrival Time: ${flight["arrival-time"][0]}</p>
          <p>Adults: ${adults}, Children: ${children}, Infants: ${infants}</p>
        `;
        flightList.appendChild(li);

        // Create input fields for passenger details
        for (let i = 0; i < adults + children + infants; i++) {
          const passengerDiv = document.createElement("div");
          passengerDiv.innerHTML = `
            <h4>Passenger ${i + 1}</h4>
            <label>First Name: <input type="text" id="first-name-${index}-${i}" required></label>
            <label>Last Name: <input type="text" id="last-name-${index}-${i}" required></label>
            <label>Date of Birth: <input type="date" id="dob-${index}-${i}" required></label>
            <label>SSN: <input type="text" id="ssn-${index}-${i}" required></label>
          `;
          passengerInputs.appendChild(passengerDiv);
        }

        // Display total price
        document.getElementById(
          "total-price"
        ).textContent = `Total Price: $${totalPrice.toFixed(2)}`;

        // Show the passenger details form
        document
          .getElementById("passenger-details-form")
          .classList.remove("hidden");
        document.getElementById("passenger-details-form").style.display =
          "block";
      })
      .catch((error) => {
        console.error("Error fetching flight details:", error);
        const li = document.createElement("li");
        li.textContent = `Failed to load details for Flight ID: ${flightId}`;
        flightList.appendChild(li);
      });
  });

  selectedFlights.return.forEach((data, index) => {
    const { flightId, adults, children, infants } = data;

    // Fetch flight details
    fetch(`http://localhost:3000/get-flight-details?flightId=${flightId}`)
      .then((response) => response.json())
      .then((flight) => {
        // Calculate the price
        const adultPrice = flight.price;
        const childPrice = adultPrice * 0.7;
        const infantPrice = adultPrice * 0.1;
        const flightTotal =
          adults * adultPrice + children * childPrice + infants * infantPrice;
        totalPrice += flightTotal;

        // Create and populate list item with flight details
        const li = document.createElement("li");
        li.innerHTML = `
          <p>Flight ID: ${flight["flight-id"][0]}</p>
          <p>Origin: ${flight.origin}</p>
          <p>Destination: ${flight.destination}</p>
          <p>Departure Date: ${flight["departure-date"][0]}</p>
          <p>Departure Time: ${flight["departure-time"][0]}</p>
          <p>Arrival Date: ${flight["arrival-date"][0]}</p>
          <p>Arrival Time: ${flight["arrival-time"][0]}</p>
          <p>Adults: ${adults}, Children: ${children}, Infants: ${infants}</p>
        `;
        flightList.appendChild(li);

        // Display total price
        document.getElementById(
          "total-price"
        ).textContent = `Total Price: $${totalPrice.toFixed(2)}`;
      })
      .catch((error) => {
        console.error("Error fetching flight details:", error);
        const li = document.createElement("li");
        li.textContent = `Failed to load details for Flight ID: ${flightId}`;
        flightList.appendChild(li);
      });
  });
} else {
  // If no flights are selected, make sure the section is hidden
  selectedFlightsSection.classList.add("hidden");
  selectedFlightsSection.style.display = "none";
}

// Book the flight and display booking information
document.getElementById("book-flight-btn").addEventListener("click", () => {
  const bookingNumber = `BOOK-${Date.now()}`;
  const bookedFlightInfo = document.getElementById("booked-flight-info");
  const passengerInfoList = document.getElementById("passenger-info-list");

  // Clear any previous booking details
  bookedFlightInfo.innerHTML = "";
  passengerInfoList.innerHTML = "";

  // Display the booking number
  document.getElementById(
    "booking-number"
  ).textContent = `Booking Number: ${bookingNumber}`;

  // Copy flight details to the booking section
  const bookingDetails = {
    bookingNumber: bookingNumber,
    flights: [],
    passengers: [],
  };

  selectedFlights.departure.forEach((data, index) => {
    const { flightId } = data;
    const flightLi = document.createElement("li");
    flightLi.textContent = `Flight ID: ${flightId}`;
    bookedFlightInfo.appendChild(flightLi);

    // Collect flight details
    bookingDetails.flights.push({ flightId });
  });

  // Collect and display passenger information
  selectedFlights.departure.forEach((data, index) => {
    for (let i = 0; i < data.adults + data.children + data.infants; i++) {
      const firstName = document.getElementById(
        `first-name-${index}-${i}`
      ).value;
      const lastName = document.getElementById(`last-name-${index}-${i}`).value;
      const dob = document.getElementById(`dob-${index}-${i}`).value;
      const ssn = document.getElementById(`ssn-${index}-${i}`).value;

      const passengerLi = document.createElement("li");
      passengerLi.textContent = `SSN: ${ssn}, Name: ${firstName} ${lastName}, DOB: ${dob}`;
      passengerInfoList.appendChild(passengerLi);

      // Add passenger details to bookingDetails
      bookingDetails.passengers.push({ firstName, lastName, dob, ssn });
    }
  });

  // Show booking details
  document.getElementById("booking-details").style.display = "block";

  // Send booking details to server
  fetch("http://localhost:3000/save-booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookingDetails),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message); // Log success message
    })
    .catch((error) => {
      console.error("Error saving booking:", error);
    });
});

// Clear local storage and reset the page
document.getElementById("clearLocalStorage").addEventListener("click", () => {
  localStorage.clear();
  alert("Local storage has been cleared!");
  flightList.innerHTML = "";
  document.getElementById("selected-flights").style.display = "none";
  document.getElementById("passenger-details-form").style.display = "none";
  document.getElementById("booking-details").style.display = "none";
});
