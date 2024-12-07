document.addEventListener("DOMContentLoaded", function () {
  const flightList = document.getElementById("flight-list");
  const selectedFlightsSection = document.getElementById("selected-flights");
  const selectedFlights = JSON.parse(localStorage.getItem("selectedFlights")) || [];
  flightList.innerHTML = ""; // Clear existing list

  let totalPrice = 0;
  const passengerInputs = document.getElementById("passenger-inputs");

  // Clear local storage and reset the page
  document.getElementById("clearLocalStorage").addEventListener("click", () => {
    localStorage.clear();
    alert("Local storage has been cleared!");
    flightList.innerHTML = "";
    document.getElementById("selected-flights").style.display = "none";
    document.getElementById("passenger-details-form").style.display = "none";
    document.getElementById("booking-details").style.display = "none";
  });

  //-------------------------GETTING SELECTED FLIGHTS -------------------------------------
  // Check if there are any selected flights
  if (selectedFlights.departure && selectedFlights.departure.length > 0) {
    // Show the selected flights section
    selectedFlightsSection.classList.remove("hidden");
    selectedFlightsSection.style.display = "block";

    // Process each selected departure flight
    selectedFlights.departure.forEach((data, flightIndex) => {
      const { flightId, adults, children, infants } = data;

      // Fetch flight details for the departure flight
      fetch(`http://localhost:3000/get-flight-details?flightId=${flightId}`)
        .then((response) => response.json())
        .then((flight) => {
          // Calculate the price
          const adultPrice = parseFloat(flight.price);
          const childPrice = adultPrice * 0.7;
          const infantPrice = adultPrice * 0.1;
          const flightTotal =
            adults * adultPrice + children * childPrice + infants * infantPrice;
          totalPrice += flightTotal;

          // Create and populate list item with flight details
          const li = document.createElement("li");
          li.innerHTML = `
            <p><strong>Departure Flight:</strong></p>
            <p>Flight ID: ${flight.flight_id}</p>
            <p>Origin: ${flight.origin}</p>
            <p>Destination: ${flight.destination}</p>
            <p>Departure Date: ${flight.departure_date}</p>
            <p>Departure Time: ${flight.departure_time}</p>
            <p>Arrival Date: ${flight.arrival_date}</p>
            <p>Arrival Time: ${flight.arrival_time}</p>
            <p>Adults: ${adults}, Children: ${children}, Infants: ${infants}</p>
          `;
          flightList.appendChild(li);

          // Create input fields for passenger details
          for (let i = 0; i < adults + children + infants; i++) {
            const passengerDiv = document.createElement("div");
            passengerDiv.classList.add("passenger-input");
            passengerDiv.innerHTML = `
              <h4>Passenger ${i + 1}</h4>
              <label>First Name: <input type="text" id="departure-first-name-${flightIndex}-${i}" required></label>
              <label>Last Name: <input type="text" id="departure-last-name-${flightIndex}-${i}" required></label>
              <label>Date of Birth: <input type="date" id="departure-dob-${flightIndex}-${i}" required></label>
              <label>SSN: <input type="text" id="departure-ssn-${flightIndex}-${i}" pattern="\\d{3}-\\d{2}-\\d{4}" placeholder="123-45-6789" required></label>
            `;
            passengerInputs.appendChild(passengerDiv);
          }

          // Display total price
          document.getElementById("total-price").textContent = `Total Price: $${totalPrice.toFixed(2)}`;

          // Show the passenger details form
          document.getElementById("passenger-details-form").classList.remove("hidden");
          document.getElementById("passenger-details-form").style.display = "block";
        })
        .catch((error) => {
          console.error("Error fetching flight details:", error);
          const li = document.createElement("li");
          li.textContent = `Failed to load details for Flight ID: ${flightId}`;
          flightList.appendChild(li);
        });
    });

    // Process return flights if present
    if (selectedFlights.return && selectedFlights.return.length > 0) {
      selectedFlights.return.forEach((data, flightIndex) => {
        const { flightId, adults, children, infants } = data;

        // Fetch flight details for the return flight
        fetch(`http://localhost:3000/get-flight-details?flightId=${flightId}`)
          .then((response) => response.json())
          .then((flight) => {
            // Calculate the price
            const adultPrice = parseFloat(flight.price);
            const childPrice = adultPrice * 0.7;
            const infantPrice = adultPrice * 0.1;
            const flightTotal =
              adults * adultPrice + children * childPrice + infants * infantPrice;
            totalPrice += flightTotal;

            // Create and populate list item with flight details
            const li = document.createElement("li");
            li.innerHTML = `
              <p><strong>Return Flight:</strong></p>
              <p>Flight ID: ${flight.flight_id}</p>
              <p>Origin: ${flight.origin}</p>
              <p>Destination: ${flight.destination}</p>
              <p>Departure Date: ${flight.departure_date}</p>
              <p>Departure Time: ${flight.departure_time}</p>
              <p>Arrival Date: ${flight.arrival_date}</p>
              <p>Arrival Time: ${flight.arrival_time}</p>
              <p>Adults: ${adults}, Children: ${children}, Infants: ${infants}</p>
            `;
            flightList.appendChild(li);

            // Create input fields for passenger details
            for (let i = 0; i < adults + children + infants; i++) {
              const passengerDiv = document.createElement("div");
              passengerDiv.classList.add("passenger-input");
              passengerDiv.innerHTML = `
                <h4>Passenger ${i + 1}</h4>
                <label>First Name: <input type="text" id="return-first-name-${flightIndex}-${i}" required></label>
                <label>Last Name: <input type="text" id="return-last-name-${flightIndex}-${i}" required></label>
                <label>Date of Birth: <input type="date" id="return-dob-${flightIndex}-${i}" required></label>
                <label>SSN: <input type="text" id="return-ssn-${flightIndex}-${i}" pattern="\\d{3}-\\d{2}-\\d{4}" placeholder="123-45-6789" required></label>
              `;
              passengerInputs.appendChild(passengerDiv);
            }

            // Update total price display after return flights
            document.getElementById("total-price").textContent = `Total Price: $${totalPrice.toFixed(2)}`;
          })
          .catch((error) => {
            console.error("Error fetching flight details:", error);
            const li = document.createElement("li");
            li.textContent = `Failed to load details for Flight ID: ${flightId}`;
            flightList.appendChild(li);
          });
      });
    }

  } else {
    // If no flights are selected, hide the section
    selectedFlightsSection.classList.add("hidden");
    selectedFlightsSection.style.display = "none";
  }

  //-------------------------BOOKING FLIGHT -------------------------------------
  document.getElementById("book-flight-btn").addEventListener("click", () => {
    // Validation: Ensure all passenger form fields have data
    const passengerInputsDiv = document.getElementById("passenger-inputs");
    const inputs = passengerInputsDiv.querySelectorAll("input");
    for (let input of inputs) {
      if (!input.value.trim()) {
        alert("Please fill in all passenger details before booking.");
        return; // Exit the function if any field is empty
      }
    }

    const bookingNumber = `BOOK-${Date.now()}`;
    const bookedFlightInfo = document.getElementById("booked-flight-info");
    const passengerInfoList = document.getElementById("passenger-info-list");

    // Clear any previous booking details
    bookedFlightInfo.innerHTML = "";
    passengerInfoList.innerHTML = "";

    // Display the booking number
    document.getElementById("booking-number").textContent = `Booking Number: ${bookingNumber}`;

    // Prepare booking details to send to the server
    const bookingDetails = {
      bookingNumber: bookingNumber,
      flights: [],
      passengers: [],
    };

    // Function to fetch flight details and prepare bookingDetails.flights
    const fetchFlightDetails = (flightsArray, type) => {
      return flightsArray.map((data, flightIndex) => {
        const { flightId, adults, children, infants } = data;
        return fetch(`http://localhost:3000/get-flight-details?flightId=${flightId}`)
          .then((response) => response.json())
          .then((flight) => {
            bookingDetails.flights.push({
              flightId: flight.flight_id,
              origin: flight.origin,
              destination: flight.destination,
              departureDate: flight.departure_date,
              departureTime: flight.departure_time,
              arrivalDate: flight.arrival_date,
              arrivalTime: flight.arrival_time,
              adults: adults,
              children: children,
              infants: infants,
              type: type, // 'departure' or 'return'
            });
          })
          .catch((error) => {
            console.error(`Error fetching ${type} flight details:`, error);
          });
      });
    };

    // Prepare promises for fetching flight details
    const departurePromises = selectedFlights.departure
      ? fetchFlightDetails(selectedFlights.departure, 'departure')
      : [];

    const returnPromises = selectedFlights.return
      ? fetchFlightDetails(selectedFlights.return, 'return')
      : [];

    // Wait for all flight details to be fetched
    Promise.all([...departurePromises, ...returnPromises]).then(() => {
      // Collect passenger details for departure flights
      selectedFlights.departure.forEach((data, flightIndex) => {
        const { adults, children, infants } = data;
        for (let i = 0; i < adults + children + infants; i++) {
          const firstName = document.getElementById(`departure-first-name-${flightIndex}-${i}`).value;
          const lastName = document.getElementById(`departure-last-name-${flightIndex}-${i}`).value;
          const dob = document.getElementById(`departure-dob-${flightIndex}-${i}`).value;
          const ssn = document.getElementById(`departure-ssn-${flightIndex}-${i}`).value;

          // Add passenger details to server payload
          bookingDetails.passengers.push({
            firstName,
            lastName,
            dob,
            ssn,
            flightType: 'departure', // To associate with the correct flight
          });
        }
      });

      // Collect passenger details for return flights if present
      if (selectedFlights.return && selectedFlights.return.length > 0) {
        selectedFlights.return.forEach((data, flightIndex) => {
          const { adults, children, infants } = data;
          for (let i = 0; i < adults + children + infants; i++) {
            const firstName = document.getElementById(`return-first-name-${flightIndex}-${i}`)?.value;
            const lastName = document.getElementById(`return-last-name-${flightIndex}-${i}`)?.value;
            const dob = document.getElementById(`return-dob-${flightIndex}-${i}`)?.value;
            const ssn = document.getElementById(`return-ssn-${flightIndex}-${i}`)?.value;

            if (firstName && lastName && dob && ssn) {
              // Add passenger details to server payload
              bookingDetails.passengers.push({
                firstName,
                lastName,
                dob,
                ssn,
                flightType: 'return', // To associate with the correct flight
              });
            }
          }
        });
      }

      // Show booking details section (temporary display until server responds)
      document.getElementById("booking-details").style.display = "block";

      // Send booking details to the server
      fetch("http://localhost:3000/save-flight-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingDetails),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Booking saved successfully.") {
            console.log("Booking completed:", data.message);
            alert("Booked Successfully!");

            // Display Flight Booking IDs, Ticket IDs, and Prices
            displayBookingDetails(data);

            // Hide flight-related divs and buttons after successful booking
            document.getElementById("passenger-details-form").style.display = "none";
            document.getElementById("clearLocalStorage").style.display = "none";
          } else {
            console.error("Error during booking:", data.message);
            alert(`Error during booking: ${data.message}`);
          }
        })
        .catch((error) => {
          console.error("Error saving booking:", error);
          alert("An error occurred while saving your booking. Please try again.");
        });
    });
  });

  /**
   * Function to display booking details including Flight Booking ID, Ticket ID, and Ticket Price
   * @param {Object} data - The response data from the server
   */
  function displayBookingDetails(data) {
    const passengerInfoList = document.getElementById("passenger-info-list");
    passengerInfoList.innerHTML = ""; // Clear existing list

    // Iterate through each booking
    data.bookings.forEach((booking) => {
      const { flightId, flightBookingId, passengers } = booking;

      // Create a sublist for each flight booking
      const flightBookingUl = document.createElement("ul");
      flightBookingUl.classList.add("flight-booking");

      // Flight Booking Header
      const header = document.createElement("li");
      header.innerHTML = `<strong>Flight ID:</strong> ${flightId} <br> <strong>Flight Booking ID:</strong> ${flightBookingId}`;
      flightBookingUl.appendChild(header);

      // Iterate through each passenger in the booking
      passengers.forEach((passenger) => {
        const { ssn, firstName, lastName, dob, ticketId, price } = passenger;

        const passengerLi = document.createElement("li");
        passengerLi.classList.add("passenger-info");
        passengerLi.innerHTML = `
          <p><strong>Passenger Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>SSN:</strong> ${ssn}</p>
          <p><strong>Date of Birth:</strong> ${dob}</p>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <p><strong>Flight Booking ID:</strong> ${flightBookingId}</p>
          <p><strong>Ticket Price:</strong> $${price.toFixed(2)}</p>
        `;
        flightBookingUl.appendChild(passengerLi);
      });

      // Append the flight booking details to the main passenger info list
      passengerInfoList.appendChild(flightBookingUl);
    });
  }
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
            
            // Hide hotel-related divs and buttons after successful booking
            document.getElementById("clearHotelCart").style.display = "none";

            // Update available rooms in hotels.json
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
                }
            } catch (updateError) {
                console.error("Error updating hotel rooms:", updateError);
            }

            // Clear cart data after successful booking
            localStorage.removeItem("cartItem");

            // Display the booking details
            const bookingDetailsDiv = document.createElement("div");
            bookingDetailsDiv.id = "hotel-booking-details";
            bookingDetailsDiv.innerHTML = `
                <h3>Hotel Booking Details:</h3>
                <ul>
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
                </ul>
            `;
            document.querySelector(".right-section").appendChild(bookingDetailsDiv);
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