
// (check description for how to validate this page
//     -the destination should be alaska, bahamas, europe or mexico
//     -for duation of cruise (minimum and maximum), minimum cannot be less than 3 and maximum cannot be greater than 10 days
//     -departing between can be anytime between sep 1st to dec 1st 2024
//     -number of guests cannot be more than 2 for each room. However infants can stay with adults even if the number of guests exceeds 2

$(document).ready(function () {
    const destination = $("#destination");
    const passengerIcon = $("#passenger-icon");
    const passengerForm = $("#passenger-form");
    const cruiseForm = $("#cruiseForm");
    const displayInfo = $("#displayInfo");
    const errorMessage = $("#errorMessage");

    // Check if user exists in localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const rightSection = $(".right-section");

    if (!user) {
        // User is not logged in
        rightSection.html(`
            <h2>Please log in first.</h2>
            <p>You must be logged in to book a cruise. <a href="login.html">Log in here</a>.</p>
        `);
        return; // Stop further execution
    }

    // Initially hide the displayInfo section
    displayInfo.addClass("hidden");

    // Toggle passenger form visibility
    passengerIcon.click(function () {
        passengerForm.toggle();
    });

    // Handle form submission
    cruiseForm.submit(function (event) {
        event.preventDefault(); // Prevent form submission

        const departureDate = $("#departure-date").val();
        const duration = $("#duration").val();
        const numberOfRooms = $("#rooms").val() || 0;
        const adults = parseInt($("#adults").val()) || 0;
        const children = parseInt($("#children").val()) || 0;
        const infants = parseInt($("#infants").val()) || 0;

        // Clear previous error messages
        errorMessage.html("");
        displayInfo.addClass("hidden");

        const messages = []; // Collect error messages

        // Validate inputs
        const isValidDate = (date) => {
            const startDate = new Date("2024-09-01");
            const endDate = new Date("2024-12-01");
            return date >= startDate && date <= endDate;
        };

        const departure = new Date(departureDate + "T12:00:00"); // Set to noon
        if (!isValidDate(departure)) {
            messages.push("Departure date must be between September 1, 2024, and December 1, 2024.");
        }

        // less than 3 days
        if (duration < 3) {
            messages.push("Your trip must last at least 3 days.");
        }
        // greater than 10 days
        else if (duration > 10) {
            messages.push("Your trip must last less than 10 days.");
        }

        const totalGuests = adults + children;
        const roomsNeeded = Math.ceil(totalGuests / 2);
        if (roomsNeeded > numberOfRooms) {
            messages.push(`You need at least ${roomsNeeded} room(s) for ${totalGuests} guests.`);
        }

        // Show error messages if any
        if (messages.length > 0) {
            errorMessage.html(messages.join("<br>"));
            displayInfo.addClass("hidden"); // Hide displayInfo if inputs are invalid
            return; // Stop execution if validation fails
        }

        // If all inputs are valid, display the information
        errorMessage.text(""); // Clear any previous error messages
        displayInfo.html(`
            <h3>Your Cruise Booking Information</h3>
            <p>Trip Destination: ${destination.find("option:selected").text()}</p>
            <p>Trip Duration: ${duration}</p>
            <p>Number of guests:</p>
            <p>Adults: ${adults}</p>
            <p>Children: ${children}</p>
            <p>Infants: ${infants}</p>
            <p>Number of rooms: ${numberOfRooms}</p>
        `);

        // Show the displayInfo section after valid input
        displayInfo.removeClass("hidden");
    });
});
