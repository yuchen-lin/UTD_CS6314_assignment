const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const xml2js = require('xml2js');
const cors = require('cors'); // Add this line
const path = require('path'); // Add this line for path handling

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS
app.use(bodyParser.json());

const builder = new xml2js.Builder();
const dataDirectory = path.join(__dirname, 'data'); // Define the path to the data directory

// Middleware to ensure the data directory exists
app.use((req, res, next) => {
    fs.mkdir(dataDirectory, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating data directory:', err);
            return res.status(500).json({ message: 'Error creating data directory' });
        }
        next();
    });
});

// For contact-us XML
app.post('/create-xml', (req, res) => {
    const userData = req.body;
    const filePath = path.join(dataDirectory, 'contacts.xml'); // Path to the contacts.xml file

    // Read the existing XML file
    fs.readFile(filePath, (err, data) => {
        if (err && err.code === 'ENOENT') {
            // If the file does not exist, create a new contacts.xml file
            const newContacts = { contacts: { contact: [userData] } };
            const xml = builder.buildObject(newContacts);

            fs.writeFile(filePath, xml, (writeErr) => {
                if (writeErr) {
                    console.error('Error writing XML file:', writeErr);
                    return res.status(500).json({ message: 'Error creating XML file' });
                }

                return res.json({ message: 'Contact added successfully!' });
            });
        } else if (err) {
            console.error('Error reading XML file:', err);
            return res.status(500).json({ message: 'Error reading XML file' });
        } else {
            // If the file exists, parse the XML data
            xml2js.parseString(data, (parseErr, result) => {
                if (parseErr) {
                    console.error('Error parsing XML file:', parseErr);
                    return res.status(500).json({ message: 'Error parsing XML file' });
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
                        console.error('Error writing XML file:', writeErr);
                        return res.status(500).json({ message: 'Error updating XML file' });
                    }

                    return res.json({ message: 'Contact added successfully!' });
                });
            });
        }
    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});