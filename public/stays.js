// -(validations details are in description)
//          -City must be a city in Texas or California
//          -date must be between Sep 1, 2024 to Dec 1st 2024
//          -number of guests cannot be more than 2 for each room. However, infants can stay with adults even if the number of guests exceeds 2  

document.addEventListener("DOMContentLoaded", async function () {
    const guestIcon = document.getElementById("guest-icon");
    const guestForm = document.getElementById("guest-form");
    const stayForm = document.getElementById("stayForm");
    const displayInfo = document.getElementById("displayInfo");
    const displayHotels = document.getElementById("displayHotels");
    const errorMessage = document.getElementById("errorMessage");

    let hotels = [];

    // Function to load hotel data
    async function loadHotels() {
        try {
            const response = await fetch('http://localhost:3000/data/hotels.json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            hotels = await response.json();
            console.log("Hotels data loaded successfully:", hotels);
        } catch (error) {
            console.error("Failed to load hotels JSON:", error);
            alert("An error occurred while loading hotel data. Please try again later.");
        }
    }

    // Load hotel data at the start
    await loadHotels();


    // Initially hide the displayInfo and displayHotels sections
    displayInfo.classList.add("hidden");
    displayHotels.classList.add("hidden");

    // Toggle guest form visibility
    guestIcon.addEventListener("click", function () {
        guestForm.style.display = guestForm.style.display === "none" ? "block" : "none";
    });

    // Handle form submission
    stayForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form submission

        const cityName = document.getElementById("city-name").value.trim().toLowerCase();
        const checkinDate = document.getElementById("checkin").value;
        const checkoutDate = document.getElementById("checkout").value;
        const numberOfRooms = parseInt(document.getElementById("rooms").value) || 0;
        const adults = parseInt(document.getElementById("adults").value) || 0;
        const children = parseInt(document.getElementById("children").value) || 0;
        const infants = parseInt(document.getElementById("infants").value) || 0;

        // Clear previous error messages
        errorMessage.innerHTML = "";
        displayInfo.classList.add("hidden");
        displayHotels.classList.add("hidden");

        const messages = []; // Collect error messages

        // Validation Functions
        const isValidDate = (date) => {
            const startDate = new Date("2024-09-01");
            const endDate = new Date("2024-12-01");
            return date >= startDate && date <= endDate;
        };

        const isValidLocation = (location) => {
            const validLocations = {
                Texas: ["abilene", "amarillo", "austin", "beaumont", "brownsville", "carrollton", 
                    "college station", "dallas", "denton", "el paso", "fort worth", "frisco", 
                    "garland", "grand prairie", "houston", "irving", "laredo", "lewisville", 
                    "mckinney", "mesquite", "midland", "odessa", "pasadena", "round rock", 
                    "san angelo", "san antonio", "san marcos", "sugar land", "tyler", 
                    "wichita falls"],
                California: ["alameda", "anaheim", "bakersfield", "chula vista", "concord", "corona", 
                    "daly city", "el monte", "fresno", "fullerton", "glendale", "hayward", 
                    "huntington beach", "irvine", "lancaster", "long beach", "los angeles", 
                    "modesto", "oakland", "ontario", "orange", "riverside", "sacramento", 
                    "san bernardino", "san diego", "san francisco", "san jose", "santa ana", 
                    "santa clara", "santa monica", "stockton", "torrance", "visalia", "woodland"]
            };
            return validLocations.Texas.includes(location) || validLocations.California.includes(location);
        };

        // Validation Checks
        if (!cityName) {
            messages.push("City name is required.");
        } else if (!isValidLocation(cityName)) {
            messages.push("The city must be in Texas or California.");
        }

        const checkin = new Date(checkinDate + "T12:00:00"); // Set to noon
        const checkout = new Date(checkoutDate + "T12:00:00"); // Set to noon

        if (!isValidDate(checkin)) {
            messages.push("Check-in date must be between September 1, 2024, and December 1, 2024.");
        }
        if (!isValidDate(checkout)) {
            messages.push("Check-out date must be between September 1, 2024, and December 1, 2024.");
        }
        if (checkin >= checkout) {
            messages.push("Check-out date must come after your check-in date.");
        }

        const totalGuests = adults + children;
        const roomsNeeded = Math.ceil(totalGuests / 2);
        if (roomsNeeded > numberOfRooms) {
            messages.push(`You need at least ${roomsNeeded} room(s) for ${totalGuests} guests.`);
        }

        // Display error messages if any
        if (messages.length > 0) {
            errorMessage.innerHTML = messages.join("<br>");
            displayInfo.classList.add("hidden");
            displayHotels.classList.add("hidden");
            return; // Stop execution if validation fails
        }

        // Display booking information
        errorMessage.textContent = "";
        displayInfo.innerHTML = `
            <h3>Your Stay Booking Information</h3>
            <p>City Name: ${cityName.charAt(0).toUpperCase() + cityName.slice(1)}</p>
            <p>Check-in Date: ${new Date(checkinDate).toDateString()}</p>
            <p>Check-out Date: ${new Date(checkoutDate).toDateString()}</p>
            <p>Number of guests:</p>
            <p>Adults: ${adults}</p>
            <p>Children: ${children}</p>
            <p>Infants: ${infants}</p>
            <p>Number of rooms: ${numberOfRooms}</p>
        `;
        displayInfo.classList.remove("hidden");

        // Display available hotels
        // Find available hotels in the requested city
        const availableHotels = hotels.filter(hotel => {
            const hotelAvailableFrom = new Date(hotel.available_from);
            const hotelAvailableTo = new Date(hotel.available_to);
            const checkin = new Date(checkinDate);
            const checkout = new Date(checkoutDate);
        
            return (
                hotel.city.toLowerCase() === cityName.toLowerCase() &&
                hotel.available_rooms >= numberOfRooms &&
                checkin >= hotelAvailableFrom &&
                checkout <= hotelAvailableTo
            );
        });        

        displayHotels.innerHTML = "<h3>Available Hotels</h3>";

        if (availableHotels.length === 0) {
            displayHotels.innerHTML += "No available hotels in the selected city within those date and with the requested number of rooms.";
        }
        else {
            availableHotels.forEach((hotel, index) => {
                displayHotels.innerHTML += `
                    <div class="hotel-card">
                        <input type="radio" id="hotel_${index}" name="hotel" value="${hotel.hotel_id}" class="hotel-radio">
                        <label for="hotel_${index}">
                            <div class="hotel-info">
                                <h4><strong>Name:</strong> ${hotel.hotel_name}</h4>
                                <p><strong>Hotel-id:</strong> ${hotel.hotel_id}</p>
                                <p><strong>City:</strong> ${hotel.city}</p>
                                <p><strong>Check-in Date:</strong> ${new Date(checkinDate).toDateString()}</p>
                                <p><strong>Check-out Date:</strong> ${new Date(checkoutDate).toDateString()}</p>
                                <p><strong>Price per Night:</strong> $${hotel.price_per_night}</p>
                            </div>
                        </label>
                    </div>
                `;
            });

            displayHotels.innerHTML += `<button id="addToCart" class="cart-button">Add to Cart</button>`;
        }

        displayHotels.classList.remove("hidden");

        // Add event listener for adding to cart
        document.getElementById("addToCart").addEventListener("click", function () {
            const selectedHotel = document.querySelector('input[name="hotel"]:checked');
            if (!selectedHotel) {
                errorMessage.innerHTML = "Please select a hotel to add to the cart.";
                return;
            }

            const hotelId = selectedHotel.value;
            const hotel = availableHotels.find(h => h.hotel_id === hotelId);

            const cartItem = {
                hotel_id: hotel.hotel_id,
                hotel_name: hotel.hotel_name,
                city: hotel.city,
                checkin_date: checkinDate,
                checkout_date: checkoutDate,
                guests: { adults, children, infants },
                rooms: numberOfRooms,
                price_per_night: hotel.price_per_night,
                total_price: numberOfRooms * hotel.price_per_night * (new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24)
            };
            localStorage.setItem("cartItem", JSON.stringify(cartItem));

            window.location.href = "cart.html";
        });
    });
});
