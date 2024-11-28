document.addEventListener("DOMContentLoaded", function () {
  const adminPhone = "222-222-2222";
  const user = JSON.parse(localStorage.getItem("user"));
  const adminSection = document.getElementById("admin-section");
  const uploadXmlBtn = document.getElementById("upload-xml-btn");
  const xmlInput = document.getElementById("xml-input");
  const uploadStatus = document.getElementById("upload-status");

  // Check if the user is the admin
  if (user && user.phone === adminPhone) {
    adminSection.style.display = "block";
  }

  // Handle the click on the "Upload Flights XML" button
  uploadXmlBtn.addEventListener("click", function () {
    xmlInput.click(); // Trigger the file input
  });

  // Handle the XML file selection
  xmlInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      // Read the XML file
      reader.onload = function (e) {
        const xmlData = e.target.result;

        // Send the XML data to the server
        fetch("http://localhost:3000/upload-flights", {
          method: "POST",
          headers: {
            "Content-Type": "application/xml",
          },
          body: xmlData,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Flights uploaded successfully!") {
              uploadStatus.textContent = "Flights uploaded successfully!";
            } else {
              uploadStatus.textContent = "Error uploading flights.";
              uploadStatus.style.color = "red";
            }
          })
          .catch((error) => {
            console.error("Error uploading XML:", error);
            uploadStatus.textContent = "Error uploading flights.";
            uploadStatus.style.color = "red";
          });
      };

      reader.readAsText(file); // Read the file as text
    }
  });
});
