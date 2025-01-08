// Init project
var express = require("express");
var app = express();

// Enable CORS for remote testing (from FCC)
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// Serve static files (HTML, CSS, JS)
app.use(express.static("public"));

// Serve the main index page
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

// Your first API endpoint to check API health
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// API route to handle the date parsing
app.get("/api/:date?", function (req, res) {
  const { date } = req.params;
  let newDate;

  // If no date is provided, use the current date/time
  if (!date) {
    newDate = new Date();
  } else {
    // Check if the input is a valid Unix timestamp (13 digits long)
    if (!isNaN(date) && date.length === 13) {
      // If it's a Unix timestamp, convert it to Date
      newDate = new Date(parseInt(date));
    } else {
      // Otherwise, try to parse it as a regular date string
      newDate = new Date(date);
    }
  }

  // Initialize the result
  let result;

  // If the date is invalid (NaN), return an error message
  if (isNaN(newDate.getTime())) {
    result = { error: "Invalid Date" };
  } else {
    // Otherwise, return the Unix timestamp and UTC date
    result = {
      unix: newDate.getTime(),
      utc: newDate.toUTCString(),
    };
  }

  // Send the result as a JSON response
  res.json(result);
});

app.get('/api/whoami', (req, res) => {

  
  const data = {
    ipaddress : req.headers['x-forwarded-for'] || req.ip,
  language : req.headers['accept-language'],
  software : req.headers['user-agent'],
  }

  res.json(data);
})

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
