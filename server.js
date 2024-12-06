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

//--------FLIGHTS---------------

// update flights seats sql
app.post("/update-flight-seats", (req, res) => {
  const { flightId, seatsToBook } = req.body;

  if (!flightId || seatsToBook <= 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  const query = `
    UPDATE flights 
    SET available_seats = available_seats - ? 
    WHERE flight_id = ? AND available_seats >= ?`;

  db.run(query, [seatsToBook, flightId, seatsToBook], function (err) {
    if (err) {
      console.error("Error updating seats:", err.message);
      return res.status(500).json({ message: "Server error while updating seats." });
    }

    if (this.changes === 0) {
      return res.status(400).json({ message: "Not enough seats available or flight not found." });
    }

    res.json({ message: "Seats updated successfully!" });
  });
});


// Search Flights SQL for flights page
app.post("/search-flights", (req, res) => {
  const { origin, destination, departureDate, adults, children, infants } = req.body;

  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ message: "Invalid search criteria." });
  }

  const totalPassengers = (adults || 0) + (children || 0) + (infants || 0);

  const query = `
    SELECT * 
    FROM flights 
    WHERE origin = ? 
      AND destination = ? 
      AND DATE(departure_date) BETWEEN DATE(?, '-3 days') AND DATE(?, '+3 days')
      AND available_seats >= ?`;

  db.all(
    query,
    [origin, destination, departureDate, departureDate, totalPassengers],
    (err, rows) => {
      if (err) {
        console.error("Error fetching flights:", err.message);
        return res.status(500).json({ message: "Server error while fetching flights." });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: "No flights found matching the criteria." });
      }

      res.json(rows);
    }
  );
});


// Get flight data from sql table
app.get("/get-flight-details", (req, res) => {
  const { flightId } = req.query;

  if (!flightId) {
    return res.status(400).json({ message: "Flight ID is required." });
  }

  const query = `SELECT * FROM flights WHERE flight_id = ?`;

  db.get(query, [flightId], (err, row) => {
    if (err) {
      console.error("Error fetching flight details:", err.message);
      return res.status(500).json({ message: "Server error while fetching flight details." });
    }

    if (!row) {
      return res.status(404).json({ message: "Flight not found." });
    }

    res.json(row);
  });
});

// book flight data sql table
app.post("/book-flight", (req, res) => {
  const { flights, passengers, totalPrice } = req.body;

  db.serialize(() => {
    const bookingId = `BOOK-${Date.now()}`;
    const insertBooking = `
      INSERT INTO flight_booking (flight_booking_id, flight_id, total_price) 
      VALUES (?, ?, ?)`;

    flights.forEach((flight) => {
      db.run(insertBooking, [bookingId, flight.flightId, totalPrice], (err) => {
        if (err) {
          console.error("Error inserting booking:", err.message);
          return res.status(500).json({ message: "Error inserting booking." });
        }
      });

      // Insert tickets and passenger details
      passengers.forEach((passenger, index) => {
        const ticketId = `TICK-${Date.now()}-${index}`;
        const insertTicket = `
          INSERT INTO tickets (ticket_id, flight_booking_id, ssn, price) 
          VALUES (?, ?, ?, ?)`;
        const passengerPrice =
          index < flight.adults
            ? flight.price
            : index < flight.adults + flight.children
            ? flight.price * 0.7
            : flight.price * 0.1;

        db.run(insertTicket, [ticketId, bookingId, passenger.ssn, passengerPrice], (err) => {
          if (err) {
            console.error("Error inserting ticket:", err.message);
            return res.status(500).json({ message: "Error inserting ticket." });
          }
        });

        const insertPassenger = `
          INSERT INTO passenger (ssn, first_name, last_name, dob, category) 
          VALUES (?, ?, ?, ?, ?)`;

        db.run(insertPassenger, [
          passenger.ssn,
          passenger.firstName,
          passenger.lastName,
          passenger.dob,
          passenger.category,
        ], (err) => {
          if (err) {
            console.error("Error inserting passenger:", err.message);
            return res.status(500).json({ message: "Error inserting passenger." });
          }
        });
      });

      // Update available seats
      const updateSeats = `
        UPDATE flights 
        SET available_seats = available_seats - ? 
        WHERE flight_id = ?`;

      db.run(updateSeats, [flight.adults + flight.children + flight.infants, flight.flightId], (err) => {
        if (err) {
          console.error("Error updating seats:", err.message);
          return res.status(500).json({ message: "Error updating seats." });
        }
      });
    });

    res.json({ message: "Booking successful!", bookingId });
  });
});

app.post("/save-booking", (req, res) => {
  const { bookingNumber, flights, passengers } = req.body;

  if (!flights || flights.length === 0 || !passengers || passengers.length === 0) {
    return res.status(400).json({ message: "Invalid booking details." });
  }

  const db = new sqlite3.Database("./data/app.db");

  db.serialize(() => {
    // Insert into flight_booking table
    const insertBookingQuery = `
      INSERT INTO flight_booking (flight_id, total_price)
      VALUES (?, ?)
    `;

    flights.forEach((flight) => {
      const { flightId, adults, children, infants } = flight;
      const totalSeats = adults + children + infants;
      const totalPrice = flight.adults * flight.price +
                         flight.children * (flight.price * 0.7) +
                         flight.infants * (flight.price * 0.1);

      db.run(insertBookingQuery, [flightId, totalPrice], function (err) {
        if (err) {
          console.error("Error inserting into flight_booking:", err.message);
          return res.status(500).json({ message: "Error saving booking." });
        }

        const flightBookingId = this.lastID; // Get the inserted flight_booking_id

        // Insert passengers and tickets
        const insertPassengerQuery = `
          INSERT INTO passenger (ssn, first_name, last_name, dob, category)
          VALUES (?, ?, ?, ?, ?)
        `;

        const insertTicketQuery = `
          INSERT INTO tickets (flight_booking_id, ssn, price)
          VALUES (?, ?, ?)
        `;

        passengers.forEach((passenger) => {
          const { ssn, firstName, lastName, dob } = passenger;

          // Determine the category based on passenger's age
          const age = new Date().getFullYear() - new Date(dob).getFullYear();
          const category = age < 2 ? "Infant" : age < 12 ? "Child" : "Adult";

          // Insert passenger
          db.run(insertPassengerQuery, [ssn, firstName, lastName, dob, category], (err) => {
            if (err) {
              console.error("Error inserting passenger:", err.message);
              // Skip duplicate passenger (already exists)
            } else {
              // Insert ticket
              const ticketPrice =
                category === "Infant"
                  ? flight.price * 0.1
                  : category === "Child"
                  ? flight.price * 0.7
                  : flight.price;

              db.run(insertTicketQuery, [flightBookingId, ssn, ticketPrice], (err) => {
                if (err) {
                  console.error("Error inserting ticket:", err.message);
                }
              });
            }
          });
        });
      });
    });

    res.json({ message: "Booking and tickets saved successfully!" });
  });

  db.close((err) => {
    if (err) {
      console.error("Error closing the database:", err.message);
    }
  });
});


//---------For hotel booking---------
// Handle booking information submission
// app.post("/save-booking", (req, res) => {
//   const bookingData = req.body; // Expecting booking data from the client
//   const bookingNumber = bookingData.bookingNumber; // Extract booking number
//   const filePath = path.join(dataDirectory, `${bookingNumber}.json`); // Define the path for the JSON file

//   // Write the booking data to a JSON file
//   fs.writeFile(filePath, JSON.stringify(bookingData, null, 2), (err) => {
//     if (err) {
//       console.error("Error writing booking JSON file:", err);
//       return res.status(500).json({ message: "Error saving booking data" });
//     }

//     return res.json({ message: "Booking saved successfully!" });
//   });
// });

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

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


// // save hotel booking
// app.post("/save-hotel-booking", (req, res) => {
//   const bookingData = req.body;
//   const filePath = path.join(__dirname, "data", "hotel_bookings.xml");
//   const builder = new xml2js.Builder();

//   fs.readFile(filePath, "utf8", (err, data) => {
//       if (err && err.code === "ENOENT") {
//           // If the file does not exist, create it with the initial booking structure
//           const newBookings = { bookings: { booking: [bookingData] } };
//           const xml = builder.buildObject(newBookings);
//           fs.writeFile(filePath, xml, (writeErr) => {
//               if (writeErr) {
//                   console.error("Error creating XML file:", writeErr);
//                   return res.status(500).json({ message: "Error creating XML file" });
//               }
//               return res.json({ message: "Booking saved successfully!" });
//           });
//       } else if (data.trim() === "") {
//           // If the file is empty, initialize it with the bookings structure
//           const initialBookings = { bookings: { booking: [bookingData] } };
//           const xml = builder.buildObject(initialBookings);
//           fs.writeFile(filePath, xml, (writeErr) => {
//               if (writeErr) {
//                   console.error("Error initializing XML file:", writeErr);
//                   return res.status(500).json({ message: "Error initializing XML file" });
//               }
//               return res.json({ message: "Booking saved successfully!" });
//           });
//       } else {
//           // If the file has data, parse and update it
//           xml2js.parseString(data, (parseErr, result) => {
//               if (parseErr) {
//                   console.error("Error parsing XML file:", parseErr);
//                   return res.status(500).json({ message: "Error parsing XML file" });
//               }
              
//               if (!result.bookings || !result.bookings.booking) {
//                   // If XML structure is missing, initialize it
//                   result = { bookings: { booking: [bookingData] } };
//               } else {
//                   // Add the new booking to existing bookings
//                   result.bookings.booking.push(bookingData);
//               }

//               const updatedXML = builder.buildObject(result);
//               fs.writeFile(filePath, updatedXML, (writeErr) => {
//                   if (writeErr) {
//                       console.error("Error updating XML file:", writeErr);
//                       return res.status(500).json({ message: "Error updating XML file" });
//                   }
//                   return res.json({ message: "Booking saved successfully!" });
//               });
//           });
//       }
//   });
// });

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
    WHERE LOWER(city) = LOWER(?)
  `;

  db.all(query, [city], (err, rows) => {
    if (err) {
      console.error("Error fetching hotels:", err.message);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // Assuming check-in and check-out date range validation is handled in the client,
    // you can apply additional server-side validation here if necessary.

    res.json(rows); // Return matching hotels
  });

  db.close((err) => {
    if (err) {
      console.error("Error closing the database:", err.message);
    }
  });
});