document.addEventListener("DOMContentLoaded", function () {
  const adminPhone = "222-222-2222";
  const user = JSON.parse(localStorage.getItem("user"));
  const adminSection = document.getElementById("admin-section");
  const uploadXmlBtn = document.getElementById("upload-xml-btn");
  const xmlInput = document.getElementById("xml-input");
  const uploadStatus = document.getElementById("upload-status");
  const uploadJsonBtn = document.getElementById("upload-json-btn");
  const jsonInput = document.getElementById("json-input");
  const jsonUploadStatus = document.getElementById("json-upload-status");

  // Check if the user is the admin
  if (user && user.phone === adminPhone) {
    adminSection.style.display = "block";
  }

  // Helper function for GET requests
  async function fetchData(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`http://localhost:3000/${endpoint}?${query}`);
    return response.json();
  }

  // Retrieve bookings using booking ID
  document.getElementById("retrieve-booking-btn").addEventListener("click", async () => {
    const bookingId = document.getElementById("booking-id").value;
    const hotel_data = await fetchData("hotel-booking-info", { id: bookingId });
    const flight_data = await fetchData("flight-booking-info", { id: bookingId });
    document.getElementById("booking-info-status").textContent = JSON.stringify(hotel_data, null, 2) + JSON.stringify(flight_data, null, 2);
  });
  
  // Retrieve passengers for a flight
  document.getElementById("retrieve-passengers-btn").addEventListener("click", async () => {
    const flightBookingId = document.getElementById("flight-booking-id").value;
    const data = await fetchData("flight-passengers", { flight_booking_id: flightBookingId });
    document.getElementById("passenger-info-status").textContent = JSON.stringify(data, null, 2);
  });

  // Retrieve bookings for a specific person using SSN
  document.getElementById("retrieve-person-flights-btn").addEventListener("click", async () => {
    const ssn = document.getElementById("ssn").value;
    const data = await fetchData("flights-by-ssn", { ssn });
    document.getElementById("person-flights-status").textContent = JSON.stringify(data, null, 2);
  });

  // Retrieve hotel and flight bookings for September 2024
  document.getElementById("retrieve-sep-bookings-btn").addEventListener("click", async () => {
    try {
      const hotelData = await fetchData("hotel-bookings-by-date", { month: "09", year: "2024" });
      const flightData = await fetchData("flight-bookings-by-date", { month: "09", year: "2024" });

      const combinedData = {
        hotels: hotelData,
        flights: flightData
      };

      document.getElementById("sep-bookings-status").textContent = JSON.stringify(combinedData, null, 2);
    } catch (error) {
      document.getElementById("sep-bookings-status").textContent = "Error fetching September bookings.";
      console.error("Error fetching September bookings:", error);
    }
  });

  //-----------------admin-------------------------
  // Flights from Texas (Sep-Oct 2024)
  document.getElementById("retrieve-flights-texas-btn").addEventListener("click", async () => {
    const city = document.getElementById("tx-departure-city").value;
    const data = await fetchData("flights-from-texas", { city });
    document.getElementById("flights-texas-status").textContent = JSON.stringify(data, null, 2);
  });

  // Hotels in Texas (Sep-Oct 2024)
  document.getElementById("retrieve-hotels-texas-btn").addEventListener("click", async () => {
    const city = document.getElementById("tx-hotel-city").value;
    const data = await fetchData("hotels-in-texas", { city });
    document.getElementById("hotels-texas-status").textContent = JSON.stringify(data, null, 2);
  });

  // Most Expensive Booked Hotels
  document.getElementById("retrieve-most-expensive-hotels-btn").addEventListener("click", async () => {
    const data = await fetchData("most-expensive-hotels");
    document.getElementById("most-expensive-hotels-status").textContent = JSON.stringify(data, null, 2);
  });

  // Flights with an Infant Passenger
  document.getElementById("retrieve-flights-infant-btn").addEventListener("click", async () => {
    const data = await fetchData("flights-with-infant");
    document.getElementById("flights-infant-status").textContent = JSON.stringify(data, null, 2);
  });

  // Flights with an Infant and 5+ Children
  document.getElementById("retrieve-flights-infant-children-btn").addEventListener("click", async () => {
    const data = await fetchData("flights-with-infant-and-children");
    document.getElementById("flights-infant-children-status").textContent = JSON.stringify(data, null, 2);
  });

  // Most Expensive Booked Flights
  document.getElementById("retrieve-most-expensive-flights-btn").addEventListener("click", async () => {
    const data = await fetchData("most-expensive-flights");
    document.getElementById("most-expensive-flights-status").textContent = JSON.stringify(data, null, 2);
  });

  // Flights from Texas with No Infant Passengers
  document.getElementById("retrieve-flights-no-infants-btn").addEventListener("click", async () => {
    const city = document.getElementById("tx-departure-no-infants").value;
    const data = await fetchData("flights-from-texas-no-infants", { city });
    document.getElementById("flights-no-infants-status").textContent = JSON.stringify(data, null, 2);
  });

  // Number of Flights Arriving in California (Sep-Oct 2024)
  document.getElementById("retrieve-flights-california-btn").addEventListener("click", async () => {
    const data = await fetchData("flights-to-california");
    document.getElementById("flights-california-status").textContent = JSON.stringify(data, null, 2);
  });

  //----------------end of admin-------------------

  // Handle Flights XML upload
  uploadXmlBtn.addEventListener("click", function () {
    xmlInput.click();
  });

  xmlInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const xmlData = e.target.result;

        fetch("http://localhost:3000/upload-flights", {
          method: "POST",
          headers: {
            "Content-Type": "application/xml",
          },
          body: xmlData,
        })
          .then((response) => response.json())
          .then((data) => {
            uploadStatus.textContent = data.message || "Error uploading flights.";
          })
          .catch((error) => {
            console.error("Error uploading XML:", error);
            uploadStatus.textContent = "Error uploading flights.";
            uploadStatus.style.color = "red";
          });
      };

      reader.readAsText(file);
    }
  });

  // Handle Hotels JSON upload
  uploadJsonBtn.addEventListener("click", function () {
    jsonInput.click();
  });

  jsonInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      // Read the JSON file
      reader.onload = function (e) {
        const jsonData = e.target.result;

        // Send the JSON data to the server
        fetch("http://localhost:3000/upload-hotels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: jsonData,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Hotels uploaded successfully!") {
              jsonUploadStatus.textContent = "Hotels uploaded successfully!";
            } else {
              jsonUploadStatus.textContent = "Error uploading hotels.";
              jsonUploadStatus.style.color = "red";
            }
          })
          .catch((error) => {
            console.error("Error uploading JSON:", error);
            jsonUploadStatus.textContent = "Error uploading hotels.";
            jsonUploadStatus.style.color = "red";
          });
      };

      reader.readAsText(file); // Read the file as text
    }
  });
});