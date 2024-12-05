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