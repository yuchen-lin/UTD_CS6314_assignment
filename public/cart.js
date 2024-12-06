document.addEventListener("DOMContentLoaded", function () {
  const flightList = document.getElementById("flight-list");
  const selectedFlightsSection = document.getElementById("selected-flights");
  const passengerInputs = document.getElementById("passenger-inputs");
  const selectedFlights = JSON.parse(localStorage.getItem("selectedFlights")) || { departure: [], return: [] };
  let totalPrice = 0;

  // Clear local storage and reset the page
  document.getElementById("clearLocalStorage").addEventListener("click", () => {
    localStorage.clear();
    alert("Local storage has been cleared!");
    flightList.innerHTML = "";
    selectedFlightsSection.style.display = "none";
    document.getElementById("passenger-details-form").style.display = "none";
    document.getElementById("booking-details").style.display = "none";
  });

  if (selectedFlights.departure.length > 0 || selectedFlights.return.length > 0) {
    selectedFlightsSection.style.display = "block";

    const processFlights = (flights, type) => {
      flights.forEach((data, index) => {
        const { flightId, adults, children, infants } = data;

        fetch(`http://localhost:3000/get-flight-details?flightId=${flightId}`)
          .then((response) => response.json())
          .then((flight) => {
            const adultPrice = flight.price;
            const childPrice = adultPrice * 0.7;
            const infantPrice = adultPrice * 0.1;
            const flightTotal = adults * adultPrice + children * childPrice + infants * infantPrice;
            totalPrice += flightTotal;

            const li = document.createElement("li");
            li.innerHTML = `
              <p>${type} Flight:</p>
              <p>Flight ID: ${flight.flight_id}</p>
              <p>Origin: ${flight.origin}</p>
              <p>Destination: ${flight.destination}</p>
              <p>Departure Date: ${new Date(flight.departure_date).toDateString()}</p>
              <p>Departure Time: ${flight.departure_time}</p>
              <p>Arrival Date: ${new Date(flight.arrival_date).toDateString()}</p>
              <p>Arrival Time: ${flight.arrival_time}</p>
              <p>Adults: ${adults}, Children: ${children}, Infants: ${infants}</p>
            `;
            flightList.appendChild(li);

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

            document.getElementById(
              "total-price"
            ).textContent = `Total Price: $${totalPrice.toFixed(2)}`;
            document.getElementById("passenger-details-form").style.display = "block";
          })
          .catch((error) => {
            console.error("Error fetching flight details:", error);
            const li = document.createElement("li");
            li.textContent = `Failed to load details for Flight ID: ${flightId}`;
            flightList.appendChild(li);
          });
      });
    };

    processFlights(selectedFlights.departure, "Departure");
    if (selectedFlights.return && selectedFlights.return.length > 0) {
      processFlights(selectedFlights.return, "Return");
    }
  } else {
    selectedFlightsSection.style.display = "none";
  }

  // Book the flight
  document.getElementById("book-flight-btn").addEventListener("click", () => {
    const bookingNumber = `BOOK-${Date.now()}`;
    const bookingDetails = {
      bookingNumber: bookingNumber,
      flights: selectedFlights.departure.concat(selectedFlights.return || []),
      passengers: [],
    };
  
    selectedFlights.departure.forEach((data, index) => {
      for (let i = 0; i < data.adults + data.children + data.infants; i++) {
        const firstName = document.getElementById(`first-name-${index}-${i}`).value;
        const lastName = document.getElementById(`last-name-${index}-${i}`).value;
        const dob = document.getElementById(`dob-${index}-${i}`).value;
        const ssn = document.getElementById(`ssn-${index}-${i}`).value;
  
        bookingDetails.passengers.push({ firstName, lastName, dob, ssn });
      }
    });
  
    fetch("http://localhost:3000/book-flight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingDetails),
    })
      .then((response) => response.json())
      .then((data) => {
        alert("Booking successful!");
        console.log(data.message);
        localStorage.clear(); // Optionally clear the cart after booking
        location.reload();
      })
      .catch((error) => {
        console.error("Error saving booking:", error);
      });
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
      // Send booking details to save in the database
      const bookingResponse = await fetch("http://localhost:3000/save-hotel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartData),
      });
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

