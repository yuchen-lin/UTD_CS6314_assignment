const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const xml2js = require("xml2js");
const cors = require("cors"); // Add this line
const path = require("path"); // Add this line for path handling
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS
app.use(bodyParser.json());

// Serve the data directory statically to access files like hotels.json
app.use('/data', express.static(path.join(__dirname, 'data')));

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

// -------------------------------FOR FLIGHTS ----------------------------------------

//Search flights for flights page
app.post("/search-flights", (req, res) => {
  const { origin, destination, departureDate, adults, children, infants } = req.body;

  // Convert the requested departureDate to a Date object
  const requestedDate = new Date(departureDate);
  if (isNaN(requestedDate)) {
    return res.status(400).json({ message: "Invalid departure date" });
  }

  // Create 3-day range around the requested date
  const threeDaysBefore = new Date(requestedDate);
  threeDaysBefore.setDate(requestedDate.getDate() - 3);

  const threeDaysAfter = new Date(requestedDate);
  threeDaysAfter.setDate(requestedDate.getDate() + 3);

  // Calculate total passengers
  const totalPassengers = adults + children + infants;

  // Retrieve flights from the database that match origin and destination
  // We’ll fetch a broader set of flights (within the 3-day window) and then filter in JS.
  const sql = `
    SELECT *
    FROM flights
    WHERE origin = ?
      AND destination = ?
    `;
  
  db.all(sql, [origin, destination], (err, rows) => {
    if (err) {
      console.error("Error querying flights database:", err);
      return res.status(500).json({ message: "Error querying flights database" });
    }

    // Filter flights based on date criteria and seat availability
    const availableFlights = rows.filter((flight) => {
      // Parse the departure_date from the DB (assumed format "YYYY-MM-DD")
      const flightDate = new Date(flight.departure_date);
      if (isNaN(flightDate)) {
        console.warn("Invalid flightDate for flight:", flight);
        return false;
      }

      // Check if flight date is within 3 days before or after the requested date
      if (flightDate < threeDaysBefore || flightDate > threeDaysAfter) {
        return false;
      }

      // Check seat availability
      if (totalPassengers > flight.available_seats) {
        return false;
      }

      // Passed all criteria
      return true;
    });

    // Now check for exact date matches
    const exactDateFlights = availableFlights.filter((flight) => {
      const flightDate = new Date(flight.departure_date);
      return flightDate.toDateString() === requestedDate.toDateString();
    });

    // Return exact date flights if available; otherwise return all available flights
    if (exactDateFlights.length > 0) {
      return res.json(exactDateFlights);
    } else {
      return res.json(availableFlights);
    }
  });
});


// To get the fight data SQL
app.get("/get-flight-details", (req, res) => {
  console.log("GETTING FLIGHT DATA (IN SERVER.JS)");

  const flightId = req.query.flightId;
  if (!flightId) {
    return res.status(400).json({ message: "Flight ID is required" });
  }

  const db = new sqlite3.Database("./data/app.db", sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  db.get("SELECT * FROM flights WHERE flight_id = ?", [flightId], (err, row) => {
    if (err) {
      console.error("Error querying database:", err.message);
      db.close();
      return res.status(500).json({ message: "Error querying database" });
    }

    if (!row) {
      db.close();
      return res.status(404).json({ message: "Flight not found" });
    }

    // Return the flight details as a JSON object with strings and no arrays
    const flightData = {
      flight_id: row.flight_id,
      origin: row.origin,
      destination: row.destination,
      departure_date: row.departure_date,
      arrival_date: row.arrival_date,
      departure_time: row.departure_time,
      arrival_time: row.arrival_time,
      available_seats: row.available_seats,
      price: row.price
    };

    console.log("RETURNING FLIGHT DATA: (IN SERVER.JS)");
    console.log(flightData);

    db.close();
    return res.json(flightData);
  });
});


// ------------------------------------- FOR FLIGHT BOOKING  --------------------------------

app.use(express.json());

// Function to ensure a passenger exists or inserts them into the database
function ensurePassenger(db, passenger) {
  return new Promise((resolve, reject) => {
    const { ssn, firstName, lastName, dob, category } = passenger;
    db.get("SELECT * FROM passenger WHERE ssn = ?", [ssn], (err, row) => {
      if (err) return reject(err);
      if (row) {
        // Passenger already exists
        return resolve();
      } else {
        // Insert new passenger
        db.run(
          "INSERT INTO passenger (ssn, first_name, last_name, dob, category) VALUES (?, ?, ?, ?, ?)",
          [ssn, firstName, lastName, dob, category],
          function (insertErr) {
            if (insertErr) return reject(insertErr);
            return resolve();
          }
        );
      }
    });
  });
}

// Function to compute prices based on passenger categories
function computeCategoryPrices(basePrice, adultsCount, childrenCount, infantsCount) {
  return {
    adultPrice: basePrice,
    childPrice: basePrice * 0.7,
    infantPrice: basePrice * 0.1,
    totalFlightPrice:
      adultsCount * basePrice +
      childrenCount * (basePrice * 0.7) +
      infantsCount * (basePrice * 0.1)
  };
}

// Function to assign categories to passengers
function assignPassengerCategories(passengers, adultsCount, childrenCount, infantsCount) {
  const assigned = [];
  let adultAssigned = 0;
  let childAssigned = 0;
  let infantAssigned = 0;

  for (let p of passengers) {
    if (adultAssigned < adultsCount) {
      assigned.push({ ...p, category: 'adult' });
      adultAssigned++;
    } else if (childAssigned < childrenCount) {
      assigned.push({ ...p, category: 'child' });
      childAssigned++;
    } else if (infantAssigned < infantsCount) {
      assigned.push({ ...p, category: 'infant' });
      infantAssigned++;
    } else {
      // If more passengers than needed, assign as adult by default
      assigned.push({ ...p, category: 'adult' });
    }
  }

  return assigned;
}

// Route to get flight details based on flightId
app.get("/get-flight-details", (req, res) => {
  const { flightId } = req.query;

  if (!flightId) {
    return res.status(400).json({ message: "flightId is required." });
  }

  const db = new sqlite3.Database("./data/app.db", sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  db.get("SELECT * FROM flights WHERE flight_id = ?", [flightId], (err, row) => {
    if (err) {
      console.error("Error fetching flight details:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (!row) {
      return res.status(404).json({ message: "Flight not found." });
    }

    res.json(row);
    db.close();
  });
});

// Route to save flight booking
app.post("/save-flight-booking", async (req, res) => {
  const bookingDetails = req.body;
  const { flights, passengers } = bookingDetails;

  // Basic validation
  if (!flights || !Array.isArray(flights) || flights.length === 0) {
    return res.status(400).json({ message: "No flights provided in booking." });
  }

  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ message: "No passengers provided in booking." });
  }

  const db = new sqlite3.Database("./data/app.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  // Initialize an array to hold booking information
  const bookingResponse = [];

  try {
    for (let flightData of flights) {
      const { flightId, adults, children, infants, type } = flightData;

      // Fetch flight details
      const flightRow = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM flights WHERE flight_id = ?", [flightId], (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(new Error("Flight not found: " + flightId));
          resolve(row);
        });
      });

      const totalPassengers = adults + children + infants;
      const availableSeats = flightRow.available_seats;

      if (availableSeats < totalPassengers) {
        throw new Error(`Not enough seats available for Flight ID: ${flightId}`);
      }

      const { adultPrice, childPrice, infantPrice, totalFlightPrice } = computeCategoryPrices(
        flightRow.price,
        adults,
        children,
        infants
      );

      console.log("UPDATING SEATS IN FLIGHT (SERVER.JS)");
      console.log(`Available Seats: ${availableSeats}`);
      console.log(`Total Passengers: ${totalPassengers}`);

      // Update available seats
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE flights SET available_seats = available_seats - ? WHERE flight_id = ?",
          [totalPassengers, flightId],
          function (updateErr) {
            if (updateErr) return reject(updateErr);
            resolve();
          }
        );
      });

      // Insert into flight_booking and get the booking ID
      const flightBookingId = await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO flight_booking (flight_id, total_price) VALUES (?, ?)",
          [flightId, totalFlightPrice],
          function (err) {
            if (err) return reject(err);
            resolve(this.lastID); // flight_booking_id
          }
        );
      });

      // Categorize passengers
      const categorizedPassengers = assignPassengerCategories(passengers, adults, children, infants);

      // Initialize an array to hold passenger ticket information
      const passengersInfo = [];

      // Ensure each passenger exists and insert tickets
      for (let p of categorizedPassengers) {
        await ensurePassenger(db, p);

        let ticketPrice;
        if (p.category === 'adult') {
          ticketPrice = adultPrice;
        } else if (p.category === 'child') {
          ticketPrice = childPrice;
        } else {
          ticketPrice = infantPrice;
        }

        // Insert ticket and get ticket ID
        const ticketId = await new Promise((resolve, reject) => {
          db.run(
            "INSERT INTO tickets (flight_booking_id, ssn, price) VALUES (?, ?, ?)",
            [flightBookingId, p.ssn, ticketPrice],
            function (err) {
              if (err) return reject(err);
              resolve(this.lastID); // ticket_id
            }
          );
        });

        // Add passenger's ticket information to the array, including price
        passengersInfo.push({
          ssn: p.ssn,
          firstName: p.firstName,
          lastName: p.lastName,
          category: p.category,
          ticketId: ticketId,
          flightBookingId: flightBookingId,
          price: ticketPrice // Added price
        });
      }

      // Add this flight's booking information to the response array
      bookingResponse.push({
        flightId: flightId,
        flightBookingId: flightBookingId,
        totalPrice: totalFlightPrice,
        passengers: passengersInfo
      });
    }

    db.close((closeErr) => {
      if (closeErr) {
        console.error("Error closing database:", closeErr.message);
        return res.status(500).json({ message: "Error finalizing booking." });
      }
      return res.status(200).json({
        message: "Booking saved successfully.",
        bookings: bookingResponse
      });
    });

  } catch (error) {
    console.error("Error saving booking:", error.message);
    db.close((closeErr) => {
      if (closeErr) {
        console.error("Error closing database after error:", closeErr.message);
      }
      res.status(500).json({ message: "An unexpected error occurred.", error: error.message });
    });
  }
});


//---------For hotel booking---------
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

// Route to update available rooms in hotels.json
app.post("/update-hotel-rooms", (req, res) => {
  const { hotel_id, rooms_booked } = req.body;
  const filePath = path.join(__dirname, "data", "hotels.json");

  fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
          console.error("Error reading hotels.json:", err);
          return res.status(500).json({ message: "Error reading hotels data" });
      }

      let hotels;
      try {
          hotels = JSON.parse(data);
      } catch (parseErr) {
          console.error("Error parsing hotels.json:", parseErr);
          return res.status(500).json({ message: "Error parsing hotels data" });
      }

      const hotel = hotels.find(h => h.hotel_id === hotel_id);
      if (!hotel) return res.status(404).json({ message: "Hotel not found" });

      if (hotel.available_rooms < rooms_booked) {
          return res.status(400).json({ message: "Not enough rooms available" });
      }

      hotel.available_rooms -= rooms_booked;

      fs.writeFile(filePath, JSON.stringify(hotels, null, 2), (writeErr) => {
          if (writeErr) {
              console.error("Error writing hotels.json:", writeErr);
              return res.status(500).json({ message: "Error updating hotel data" });
          }

          return res.json({ message: "Hotel rooms updated successfully" });
      });
  });
});

// save hotel booking
app.post("/save-hotel-booking", (req, res) => {
  const bookingData = req.body;

  const db = new sqlite3.Database("./data/app.db");

  const insertQuery = `
    INSERT INTO hotel_booking (
      hotel_id, check_in_date, check_out_date, number_of_rooms, 
      price_per_night, total_price
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    insertQuery,
    [
      bookingData.hotel_id,
      bookingData.checkin_date,
      bookingData.checkout_date,
      bookingData.rooms,
      bookingData.price_per_night,
      bookingData.total_price,
    ],
    function (err) {
      if (err) {
        console.error("Error saving booking:", err.message);
        return res.status(500).json({ message: "Error saving booking data." });
      }

      console.log(`Booking saved with ID: ${this.lastID}`);
      res.json({ message: "Booking saved successfully!", booking_id: this.lastID });
    }
  );

  db.close((err) => {
    if (err) {
      console.error("Error closing the database:", err.message);
    }
  });
});

// -----for register.js -----
const dbPath = path.join(__dirname, "data", "app.db");
// Create /data folder and database file
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");

    // Create the "users" table
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        gender TEXT
      )`,
      (err) => {
        if (err) {
          console.error("Error creating users table:", err.message);
        } else {
          console.log("Users table ready.");
        }
      }
    );

    // Create the "flights" table
    db.run(
      `CREATE TABLE IF NOT EXISTS flights (
        flight_id TEXT  PRIMARY KEY,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        arrival_date TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        available_seats INTEGER NOT NULL,
        price REAL NOT NULL
      )`,
      (err) => {
        if (err) {
          console.error("Error creating flights table:", err.message);
        } else {
          console.log("Flights table ready.");
        }
      }
    );

    // Create the "passenger" table
    db.run(
      `CREATE TABLE IF NOT EXISTS passenger (
        ssn TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        category TEXT NOT NULL
      )`,
      (err) => {
        if (err) {
          console.error("Error creating passenger table:", err.message);
        } else {
          console.log("Passenger table ready.");
        }
      }
    );

    // Create the "flight_booking" table
    db.run(
      `CREATE TABLE IF NOT EXISTS flight_booking (
        flight_booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_id INTEGER NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (flight_id) REFERENCES flights (flight_id)
      )`,
      (err) => {
        if (err) {
          console.error("Error creating flight_booking table:", err.message);
        } else {
          console.log("Flight booking table ready.");
        }
      }
    );

    // Create the "tickets" table
    db.run(
      `CREATE TABLE IF NOT EXISTS tickets (
        ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_booking_id INTEGER NOT NULL,
        ssn TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (flight_booking_id) REFERENCES flight_booking (flight_booking_id),
        FOREIGN KEY (ssn) REFERENCES passenger (ssn)
      )`,
      (err) => {
        if (err) {
          console.error("Error creating tickets table:", err.message);
        } else {
          console.log("Tickets table ready.");
        }
      }
    );

    // Create the "hotel" table
    db.run(
      `CREATE TABLE IF NOT EXISTS hotel (
        hotel_id TEXT PRIMARY KEY,
        hotel_name TEXT NOT NULL,
        city TEXT NOT NULL,
        price_per_night REAL NOT NULL
      )`,
      (err) => {
        if (err) {
          console.error("Error creating hotel table:", err.message);
        } else {
          console.log("Hotel table ready.");
        }
      }
    );

    // Create the "guests" table
    db.run(
      `CREATE TABLE IF NOT EXISTS guests (
        ssn TEXT PRIMARY KEY,
        hotel_booking_id INTEGER NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        category TEXT NOT NULL,
        FOREIGN KEY (hotel_booking_id) REFERENCES hotel_booking (hotel_booking_id)
      )`,
      (err) => {
        if (err) {
          console.error("Error creating guests table:", err.message);
        } else {
          console.log("Guests table ready.");
        }
      }
    );

    // Create the "hotel_booking" table
    db.run(
      `CREATE TABLE IF NOT EXISTS hotel_booking (
        hotel_booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER NOT NULL,
        check_in_date TEXT NOT NULL,
        check_out_date TEXT NOT NULL,
        number_of_rooms INTEGER NOT NULL,
        price_per_night REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (hotel_id) REFERENCES hotel (hotel_id)
      )`,
      (err) => {
        if (err) {
          console.error("Error creating hotel_booking table:", err.message);
        } else {
          console.log("Hotel booking table ready.");
        }
      }
    );
  }
});

// Registration endpoint
app.post("/register", async (req, res) => {
  const { phone, password, firstName, lastName, dob, email, gender } = req.body;

  // Validation
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;

  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: "Phone number must be in the format ddd-ddd-dddd." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }
  if (!dobRegex.test(dob)) {
    return res.status(400).json({ message: "Date of birth must be in MM/DD/YYYY format." });
  }
  if (!email.includes("@") || !email.endsWith(".com")) {
    return res.status(400).json({ message: "Email must contain '@' and end with '.com'." });
  }

  try {
    console.log(phone, password, firstName, lastName, dob, email, gender);
    // Insert user into the database
    const sql = `INSERT INTO users (phone, password, first_name, last_name, dob, email, gender) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [phone, password, firstName, lastName, dob, email, gender || null], (err) => {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ message: "Phone number or email is already in use." });
        }
        console.error("Error inserting user:", err.message);
        return res.status(500).json({ message: "Server error. Please try again later." });
      }
      res.status(201).json({ message: "Registration successful!" });
    });
  } catch (err) {
    console.error("Error hashing password:", err.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Endpoint to check if a phone number is already in use
app.post("/check-phone", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  const sql = `SELECT COUNT(*) AS count FROM users WHERE phone = ?`;
  db.get(sql, [phone], (err, row) => {
    if (err) {
      console.error("Error querying database:", err.message);
      return res.status(500).json({ message: "Server error. Please try again later." });
    }

    if (row.count > 0) {
      return res.status(200).json({ isUnique: false });
    } else {
      return res.status(200).json({ isUnique: true });
    }
  });
});

// for login page
app.post("/login", (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: "Phone number and password are required." });
  }

  const sql = `SELECT * FROM users WHERE phone = ?`;
  db.get(sql, [phone], async (err, user) => {
    if (err) {
      console.error("Error querying database:", err.message);
      return res.status(500).json({ message: "Server error. Please try again later." });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid phone number or password." });
    }

    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid phone number or password." });
    }

    res.status(200).json({
      message: "Login successful!",
      user: {
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        email: user.email,
      },
    });
  });
});

app.use(bodyParser.text({ type: "application/xml" }));

// ----Flights sql table upload  route ----
app.post("/upload-flights", (req, res) => {
  const xmlData = req.body;

  xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
    if (err) {
      console.error("Error parsing XML:", err.message);
      return res.status(400).json({ message: "Invalid XML format." });
    }

    const flights = result.flights.flight; // Adjust based on your XML structure
    const db = new sqlite3.Database("./data/app.db");

    const insertQuery = `INSERT INTO flights 
      (flight_id, origin, destination, departure_date, arrival_date, departure_time, arrival_time, available_seats, price) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.serialize(() => {
      if (Array.isArray(flights)) {
        // Handle multiple flight entries
        flights.forEach((flight) => {
          db.run(
            insertQuery,
            [
              flight["flight-id"],
              flight.origin,
              flight.destination,
              flight["departure-date"],
              flight["arrival-date"],
              flight["departure-time"],
              flight["arrival-time"],
              flight["available-seats"],
              flight.price,
            ],
            (err) => {
              if (err) {
                console.error("Error inserting flight:", err.message);
              }
            }
          );
        });
      } else if (flights) {
        // Handle a single flight entry
        db.run(
          insertQuery,
          [
            flights["flight-id"],
            flights.origin,
            flights.destination,
            flights["departure-date"],
            flights["arrival-date"],
            flights["departure-time"],
            flights["arrival-time"],
            flights["available-seats"],
            flights.price,
          ],
          (err) => {
            if (err) {
              console.error("Error inserting flight:", err.message);
            }
          }
        );
      } else {
        console.error("No valid flight data found in XML.");
      }
    });

    db.close((err) => {
      if (err) {
        console.error("Error closing the database:", err.message);
      } else {
        console.log("Database connection closed.");
      }
    });

    res.json({ message: "Flights uploaded successfully!" });
  });
});
//end of flight table upload

// ----Hotels table upload route----
app.post("/upload-hotels", express.json(), (req, res) => {
  const hotels = req.body;

  if (!Array.isArray(hotels)) {
    return res.status(400).json({ message: "Invalid JSON format. Expected an array." });
  }

  const db = new sqlite3.Database("./data/app.db");

  const insertQuery = `INSERT INTO hotel (hotel_id, hotel_name, city, price_per_night) VALUES (?, ?, ?, ?)`;

  db.serialize(() => {
    hotels.forEach((hotel) => {
      db.run(
        insertQuery,
        [
          hotel.hotel_id,
          hotel.hotel_name,
          hotel.city,
          hotel.price_per_night,
        ],
        (err) => {
          if (err) {
            console.error("Error inserting hotel:", err.message);
          }
        }
      );
    });
  });

  db.close((err) => {
    if (err) {
      console.error("Error closing the database:", err.message);
    } else {
      console.log("Database connection closed.");
    }
  });

  res.json({ message: "Hotels uploaded successfully!" });
});
// End of hotel table upload




// Route to fetch hotels based on filters
app.get("/hotels", (req, res) => {
  const { city, checkin, checkout, rooms } = req.query;

  const db = new sqlite3.Database("./data/app.db");

  // Query to find available hotels
  const query = `
    SELECT * FROM hotel
    WHERE LOWER(city) = LOWER(?)`
  ;

  db.all(query, [city], (err, rows) => {
    if (err) {
      console.error("Error fetching hotels:", err.message);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    
    res.json(rows); // Return matching hotels
  });

  db.close((err) => {
    if (err) {
      console.error("Error closing the database:", err.message);
    }
  });
});

// Retrieve booking information by ID
app.get("/hotel-booking-info", (req, res) => {
  const { id } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.get(
    `SELECT * FROM hotel_booking WHERE hotel_booking_id = ?`,
    [id],
    (err, row) => {
      if (err) {
        console.error("Error fetching booking info:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(row || { message: "No booking found with the given ID." });
      }
    }
  );

  db.close();
});

// Retrieve flight booking information by ID
app.get("/flight-booking-info", (req, res) => {
  const { id } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.get(
    `SELECT * FROM flight_booking WHERE flight_booking_id = ?`,
    [id],
    (err, row) => {
      if (err) {
        console.error("Error fetching flight booking info:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(row || { message: "No flight booking found with the given ID." });
      }
    }
  );

  db.close();
});

// Retrieve passengers for a specific flight booking
app.get("/flight-passengers", (req, res) => {
  const { flight_booking_id } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `SELECT p.* FROM passenger p
     JOIN tickets t ON p.ssn = t.ssn
     WHERE t.flight_booking_id = ?`,
    [flight_booking_id],
    (err, rows) => {
      if (err) {
        console.error("Error fetching passengers:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

// Retrieve flights for a specific person using SSN
app.get("/flights-by-ssn", (req, res) => {
  const { ssn } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `SELECT f.* FROM flight_booking f
     JOIN tickets t ON f.flight_booking_id = t.flight_booking_id
     WHERE t.ssn = ?`,
    [ssn],
    (err, rows) => {
      if (err) {
        console.error("Error fetching flights for person:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

// Retrieve hotel bookings for Sep 2024
app.get("/hotel-bookings-by-date", (req, res) => {
  const { month, year } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `SELECT * FROM hotel_booking WHERE strftime('%m', check_in_date) = ? AND strftime('%Y', check_in_date) = ?`,
    [month, year],
    (err, rows) => {
      if (err) {
        console.error("Error fetching hotel bookings by date:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

// Retrieve flight bookings for Sep 2024
app.get("/flight-bookings-by-date", (req, res) => {
  const { month, year } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `SELECT * FROM flights WHERE strftime('%m', departure_date) = ? AND strftime('%Y', departure_date) = ?`,
    [month, year],
    (err, rows) => {
      if (err) {
        console.error("Error fetching flight bookings by date:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

//--------------------------------------------------------------------------
//--------------------------------admin section-----------------------------
//--------------------------------------------------------------------------

// Retrieve flights departing from a city in Texas from Sep 2024 to Oct 2024
app.get("/flights-from-texas", (req, res) => {
  const { city } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `SELECT * FROM flights
     WHERE LOWER(origin) = LOWER(?) 
     AND departure_date BETWEEN '2024-09-01' AND '2024-10-31'`,
    [city],
    (err, rows) => {
      if (err) {
        console.error("Error fetching flights from Texas:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

// Retrieve hotel bookings in a city in Texas from Sep 2024 to Oct 2024
app.get("/hotels-in-texas", (req, res) => {
  const { city } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `
    SELECT hb.*, h.city
    FROM hotel_booking hb
    JOIN hotel h ON hb.hotel_id = h.hotel_id
    WHERE LOWER(h.city) = LOWER(?)
    AND hb.check_in_date BETWEEN '2024-09-01' AND '2024-10-31'
    `,
    [city],
    (err, rows) => {
      if (err) {
        console.error("Error fetching hotels in Texas:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

// Retrieve the most expensive booked hotels
app.get("/most-expensive-hotels", (req, res) => {
  const db = new sqlite3.Database("./data/app.db");

  db.get(
    `SELECT * FROM hotel_booking
     ORDER BY total_price DESC
     LIMIT 1`,
    (err, row) => {
      if (err) {
        console.error("Error fetching most expensive hotels:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(row || { message: "No hotel bookings found." });
      }
    }
  );

  db.close();
});

// Retrieve flights with an infant passenger
app.get("/flights-with-infant", (req, res) => {
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `SELECT DISTINCT f.* FROM flights f
     JOIN tickets t ON f.flight_id = t.flight_booking_id
     JOIN passenger p ON t.ssn = p.ssn
     WHERE LOWER(p.category) = 'infant'`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching flights with infant passengers:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

// Retrieve flights with an infant passenger and at least 5 children
app.get("/flights-with-infant-and-children", (req, res) => {
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `SELECT DISTINCT f.* FROM flights f
     JOIN tickets t ON f.flight_id = t.flight_booking_id
     JOIN passenger p ON t.ssn = p.ssn
     WHERE LOWER(p.category) = 'infant'
     AND (SELECT COUNT(*) FROM passenger WHERE LOWER(category) = 'child' AND passenger.ssn = t.ssn) >= 5`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching flights with infant and 5+ children:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

// Retrieve the most expensive booked flights
app.get("/most-expensive-flights", (req, res) => {
  const db = new sqlite3.Database("./data/app.db");

  db.get(
    `SELECT * FROM flights
     ORDER BY price DESC
     LIMIT 1`,
    (err, row) => {
      if (err) {
        console.error("Error fetching most expensive flights:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(row || { message: "No flight bookings found." });
      }
    }
  );

  db.close();
});

// Retrieve flights departing from a Texas city with no infant passengers
app.get("/flights-from-texas-no-infants", (req, res) => {
  const { city } = req.query;
  const db = new sqlite3.Database("./data/app.db");

  db.all(
    `SELECT DISTINCT f.* FROM flights f
     LEFT JOIN tickets t ON f.flight_id = t.flight_id
     LEFT JOIN passenger p ON t.ssn = p.ssn
     WHERE LOWER(f.origin) = LOWER(?) 
     AND (p.category IS NULL OR LOWER(p.category) != 'infant')`,
    [city],
    (err, rows) => {
      if (err) {
        console.error("Error fetching flights from Texas without infants:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(rows);
      }
    }
  );

  db.close();
});

// Retrieve the number of flights arriving in California in Sep-Oct 2024
app.get("/flights-to-california", (req, res) => {
  const db = new sqlite3.Database("./data/app.db");
  const californiaCities = [
    "los angeles",
    "san francisco",
    "san diego",
    "sacramento",
    "san jose",
    "fresno",
    "oakland",
    "long beach",
    "bakersfield",
    "anaheim",
    "riverside",
    "stockton",
    "irvine",
    "chula vista",
    "fremont",
    "san bernardino",
    "modesto",
    "fontana",
    "santa ana",
    "glendale",
    "huntington beach",
    "moreno valley",
    "oceanside",
    "elk grove",
    "garden grove",
    "rancho cucamonga",
    "santa clarita",
    "ontario",
    "salinas",
    "hayward",
    "visalia",
    "palmdale",
    "pasadena",
    "escondido",
    "torrance",
    "orange",
    "fullerton",
    "roseville",
    "corona",
    "concord",
    "thousand oaks",
    "simi valley",
    "santa rosa"
  ];

  const placeholders = californiaCities.map(() => "?").join(", ");

  db.get(
    `SELECT COUNT(*) AS flight_count FROM flights
     WHERE LOWER(destination) IN (${placeholders})
     AND departure_date BETWEEN '2024-09-01' AND '2024-10-31'`,
    (err, row) => {
      if (err) {
        console.error("Error fetching flights to California:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(row || { message: "No flights found." });
      }
    }
  );

  db.close();
});