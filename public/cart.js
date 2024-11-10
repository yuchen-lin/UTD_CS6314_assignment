document.addEventListener("DOMContentLoaded", function () {
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
          <p>Departure Flight:</p>
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
          <p>Return Flight:</p>
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

  // Process departure flights
  selectedFlights.departure.forEach((data, index) => {
    const { flightId, adults, children, infants } = data;

    // Fetch flight details for the booked flight
    fetch(`http://localhost:3000/get-flight-details?flightId=${flightId}`)
      .then((response) => response.json())
      .then((flight) => {
        // Create and populate list item with flight details
        const flightLi = document.createElement("li");
        flightLi.innerHTML = `
          <p>Departure Flight:</p>
          <p>Flight ID: ${flight["flight-id"][0]}</p>
          <p>Origin: ${flight.origin}</p>
          <p>Destination: ${flight.destination}</p>
          <p>Departure Date: ${flight["departure-date"][0]}</p>
          <p>Departure Time: ${flight["departure-time"][0]}</p>
          <p>Arrival Date: ${flight["arrival-date"][0]}</p>
          <p>Arrival Time: ${flight["arrival-time"][0]}</p>
          <p>Adults: ${adults}, Children: ${children}, Infants: ${infants}</p>
        `;
        bookedFlightInfo.appendChild(flightLi);

        // Collect flight details
        bookingDetails.flights.push({
          flightId: flight["flight-id"][0],
          origin: flight.origin,
          destination: flight.destination,
          departureDate: flight["departure-date"][0],
          departureTime: flight["departure-time"][0],
          arrivalDate: flight["arrival-date"][0],
          arrivalTime: flight["arrival-time"][0],
          adults: adults,
          children: children,
          infants: infants,
        });

        // Update flight seats
        return fetch("http://localhost:3000/update-flight-seats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            flightId: flightId,
            seatsToBook: adults + children + infants, // Total seats to book
          }),
        });
      })
      .then((response) => response.json())
      .then((data) => {
        console.log(
          `Seats booked for Flight ID ${data.flightId}:`,
          data.message
        ); // Log success message
      })
      .catch((error) => {
        console.error(
          "Error fetching flight details or updating seats:",
          error
        );
      });
  });

  // Process return flights if they exist
  if (selectedFlights.return && selectedFlights.return.length > 0) {
    selectedFlights.return.forEach((data, index) => {
      const { flightId, adults, children, infants } = data;

      // Fetch flight details for the return flight
      fetch(`http://localhost:3000/get-flight-details?flightId=${flightId}`)
        .then((response) => response.json())
        .then((flight) => {
          // Create and populate list item with flight details
          const flightLi = document.createElement("li");
          flightLi.innerHTML = `
            <p>Return Flight:</p>
            <p>Flight ID: ${flight["flight-id"][0]}</p>
            <p>Origin: ${flight.origin}</p>
            <p>Destination: ${flight.destination}</p>
            <p>Departure Date: ${flight["departure-date"][0]}</p>
            <p>Departure Time: ${flight["departure-time"][0]}</p>
            <p>Arrival Date: ${flight["arrival-date"][0]}</p>
            <p>Arrival Time: ${flight["arrival-time"][0]}</p>
            <p>Adults: ${adults}, Children: ${children}, Infants: ${infants}</p>
          `;
          bookedFlightInfo.appendChild(flightLi);

          // Collect return flight details
          bookingDetails.flights.push({
            flightId: flight["flight-id"][0],
            origin: flight.origin,
            destination: flight.destination,
            departureDate: flight["departure-date"][0],
            departureTime: flight["departure-time"][0],
            arrivalDate: flight["arrival-date"][0],
            arrivalTime: flight["arrival-time"][0],
            adults: adults,
            children: children,
            infants: infants,
          });

          // Update flight seats
          return fetch("http://localhost:3000/update-flight-seats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              flightId: flightId,
              seatsToBook: adults + children + infants, // Total seats to book
            }),
          });
        })
        .then((response) => response.json())
        .then((data) => {
          console.log(
            `Seats booked for Flight ID ${data.flightId}:`,
            data.message
          ); // Log success message
        })
        .catch((error) => {
          console.error(
            "Error fetching flight details or updating seats:",
            error
          );
        });
    });
  }

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

});

//----------------Hotel Bookings---------------

document.addEventListener("DOMContentLoaded", function () {
  const selectedHotelDiv = document.getElementById("selected-hotel");
  const hotelDetailsList = document.getElementById("hotel-details");
  const cartData = JSON.parse(localStorage.getItem("cartItem"));

  // Display selected hotel details if cart data exists
  if (cartData) {
      selectedHotelDiv.classList.remove("hidden");
      hotelDetailsList.innerHTML = `
          <li><strong>Hotel ID:</strong> ${cartData.hotel_id}</li>
          <li><strong>Hotel Name:</strong> ${cartData.hotel_name}</li>
          <li><strong>City:</strong> ${cartData.city}</li>
          <li><strong>Check-in Date:</strong> ${new Date(cartData.checkin_date).toDateString()}</li>
          <li><strong>Check-out Date:</strong> ${new Date(cartData.checkout_date).toDateString()}</li>
          <li><strong>Adults:</strong> ${cartData.guests.adults}</li>
          <li><strong>Children:</strong> ${cartData.guests.children}</li>
          <li><strong>Infants:</strong> ${cartData.guests.infants}</li>
          <li><strong>Number of Rooms:</strong> ${cartData.rooms}</li>
          <li><strong>Price per Night:</strong> $${cartData.price_per_night}</li>
          <li><strong>Total Price:</strong> $${cartData.total_price.toFixed(2)}</li>
      `;
  } else {
      selectedHotelDiv.innerHTML = "<p>No hotel selected in the cart.</p>";
  }

  // Book hotel
  document.getElementById("book-hotel-btn").addEventListener("click", async function () {
    if (!cartData) {
        alert("No hotel selected to book.");
        return;
    }

    try {
        // Send booking details to save in XML
        const bookingResponse = await fetch("http://localhost:3000/save-hotel-booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cartData)
        });

        if (bookingResponse.ok) {
            alert("Hotel booking confirmed!");
            
            // Update available rooms in hotels.json in a separate try-catch block
            try {
                const updateResponse = await fetch("http://localhost:3000/update-hotel-rooms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ hotel_id: cartData.hotel_id, rooms_booked: cartData.rooms })
                });

                // Log status and response body for debugging
                console.log("Update Response Status:", updateResponse.status);
                const updateResponseBody = await updateResponse.json();
                console.log("Update Response Body:", updateResponseBody);

                if (!updateResponse.ok) {
                    console.error("Failed to update hotel rooms.");
                    //alert("Error occurred while updating hotel rooms, but booking was saved.");
                }
            } catch (updateError) {
                console.error("Error updating hotel rooms:", updateError);
                //alert("Error occurred while updating hotel rooms, but booking was saved.");
            }

            // Clear cart data after successful booking
            localStorage.removeItem("cartItem");
        } else {
            alert("Booking failed. Please try again.");
        }
    } catch (error) {
        console.error("Error while booking the hotel:", error);
        alert("An error occurred while confirming the booking.");
    }
  });


  // Clear cart
  document.getElementById("clearHotelCart").addEventListener("click", function () {
      localStorage.removeItem("cartItem");
      selectedHotelDiv.innerHTML = "<p>Hotel cart cleared.</p>";
      selectedHotelDiv.classList.add("hidden");
  });

  
});

