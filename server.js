const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const xml2js = require("xml2js");
const cors = require("cors"); // Add this line
const path = require("path"); // Add this line for path handling

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS
app.use(bodyParser.json());

const builder = new xml2js.Builder();
const dataDirectory = path.join(__dirname, "data"); // Define the path to the data directory

// Middleware to ensure the data directory exists
app.use((req, res, next) => {
  fs.mkdir(dataDirectory, { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating data directory:", err);
      return res.status(500).json({ message: "Error creating data directory" });
    }
    next();
  });
});

// For contact-us XML
app.post("/create-xml", (req, res) => {
  const userData = req.body;
  const filePath = path.join(dataDirectory, "contacts.xml"); // Path to the contacts.xml file

  // Read the existing XML file
  fs.readFile(filePath, (err, data) => {
    if (err && err.code === "ENOENT") {
      // If the file does not exist, create a new contacts.xml file
      const newContacts = { contacts: { contact: [userData] } };
      const xml = builder.buildObject(newContacts);

      fs.writeFile(filePath, xml, (writeErr) => {
        if (writeErr) {
          console.error("Error writing XML file:", writeErr);
          return res.status(500).json({ message: "Error creating XML file" });
        }

        return res.json({ message: "Contact added successfully!" });
      });
    } else if (err) {
      console.error("Error reading XML file:", err);
      return res.status(500).json({ message: "Error reading XML file" });
    } else {
      // If the file exists, parse the XML data
      xml2js.parseString(data, (parseErr, result) => {
        if (parseErr) {
          console.error("Error parsing XML file:", parseErr);
          return res.status(500).json({ message: "Error parsing XML file" });
        }

        // Add the new contact to the contacts list
        if (!result.contacts || !result.contacts.contact) {
          result.contacts = { contact: [] };
        }
        result.contacts.contact.push(userData);

        // Rebuild the XML and write it back to the file
        const xml = builder.buildObject(result);

        fs.writeFile(filePath, xml, (writeErr) => {
          if (writeErr) {
            console.error("Error writing XML file:", writeErr);
            return res.status(500).json({ message: "Error updating XML file" });
          }

          return res.json({ message: "Contact added successfully!" });
        });
      });
    }
  });
});

// For flights page
app.post("/search-flights", (req, res) => {
  const { origin, destination, departureDate, adults, children, infants } =
    req.body;

  const filePath = path.join(dataDirectory, "flights_availableSeats.xml");

  // Read the available flights XML file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error reading flights XML file:", err);
      return res
        .status(500)
        .json({ message: "Error reading flights XML file" });
    }

    // Parse the XML data
    xml2js.parseString(data, (parseErr, result) => {
      if (parseErr) {
        console.error("Error parsing flights XML file:", parseErr);
        return res
          .status(500)
          .json({ message: "Error parsing flights XML file" });
      }

      // Filter flights based on the input criteria
      const flights = result.flights.flight; // Adjust based on the XML structure
      const availableFlights = flights.filter((flight) => {
        // Check if departure-date exists and is an array
        if (
          !flight["departure-date"] ||
          flight["departure-date"].length === 0
        ) {
          console.warn("Flight departure-date is undefined or empty:", flight);
          return false; // Exclude this flight
        }

        // Access the first element of the departure-date
        const flightDate = new Date(flight["departure-date"][0]); // Ensure this is the correct index
        if (isNaN(flightDate)) {
          console.warn("Invalid flightDate for flight:", flight);
          return false; // Exclude this flight
        }

        // Convert the requested departureDate to a Date object for comparison
        const requestedDate = new Date(departureDate);

        // Check if the flight date is within 3 days before or after the requested departure date
        const threeDaysBefore = new Date(requestedDate);
        threeDaysBefore.setDate(requestedDate.getDate() - 3);

        const threeDaysAfter = new Date(requestedDate);
        threeDaysAfter.setDate(requestedDate.getDate() + 3);

        // Include flights that are within the range of three days before and after the requested date
        if (flightDate < threeDaysBefore || flightDate > threeDaysAfter) {
          return false; // Exclude flights that are outside the 3-day range
        }

        // Check if origin matches
        if (flight["origin"][0] !== origin) {
          return false; // Exclude flights that don't match the origin
        }

        // Check if destination matches
        if (flight["destination"][0] !== destination) {
          return false; // Exclude flights that don't match the destination
        }

        // Calculate total number of passengers
        const totalPassengers = adults + children + infants;

        // Get the available seats for the flight
        const availableSeats = parseInt(flight["available-seats"][0]) || 0;

        // Validate passenger counts against available seats
        if (totalPassengers > availableSeats) {
          return false; // Exclude flights that do not have enough available seats
        }

        // If all checks pass, include this flight
        return true;
      });

      // Now check if there are exact matches within availableFlights
      const exactDateFlights = availableFlights.filter((flight) => {
        const flightDate = new Date(flight["departure-date"][0]);
        return (
          flightDate.toDateString() === new Date(departureDate).toDateString()
        );
      });

      // Return exact date flights if available; otherwise return all available flights
      if (exactDateFlights.length > 0) {
        return res.json(exactDateFlights);
      } else {
        return res.json(availableFlights);
      }
    });
  });
});

// To get the fight data
app.get("/get-flight-details", (req, res) => {
  const flightId = req.query["flightId"];
  if (!flightId) {
    return res.status(400).json({ message: "Flight ID is required" });
  }

  const filePath = path.join(dataDirectory, "flights_availableSeats.xml");

  // Read the XML file and handle the request
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error reading flights XML file:", err);
      return res
        .status(500)
        .json({ message: "Error reading flights XML file" });
    }

    // Parse XML data and respond
    xml2js.parseString(data, (parseErr, result) => {
      if (parseErr) {
        console.error("Error parsing flights XML file:", parseErr);
        return res
          .status(500)
          .json({ message: "Error parsing flights XML file" });
      }

      const flights = result.flights.flight;
      const flightInfo = flights.find(
        (flight) => flight["flight-id"][0] === flightId
      );

      if (!flightInfo) {
        return res.status(404).json({ message: "Flight not found" });
      }

      return res.json(flightInfo);
    });
  });
});

// Handle booking information submission
app.post("/save-booking", (req, res) => {
  const bookingData = req.body; // Expecting booking data from the client
  const bookingNumber = bookingData.bookingNumber; // Extract booking number
  const filePath = path.join(dataDirectory, `${bookingNumber}.json`); // Define the path for the JSON file

  // Write the booking data to a JSON file
  fs.writeFile(filePath, JSON.stringify(bookingData, null, 2), (err) => {
    if (err) {
      console.error("Error writing booking JSON file:", err);
      return res.status(500).json({ message: "Error saving booking data" });
    }

    return res.json({ message: "Booking saved successfully!" });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
