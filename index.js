// Init project
var express = require("express");
var app = express();
const bodyParser = require('body-parser')
const dns = require('dns')

// Enable CORS for remote testing (from FCC)
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// Serve static files (HTML, CSS, JS)
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

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
const urlDatabase = [];
let counter = 1;

app.post('/api/shorturl', (req, res) => {

  // URL validation using regex
  const urlRegex = /^(http|https):\/\/(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/.*)?$/;
  if (!urlRegex.test(url)) {
    return res.json({ error: 'invalid url' });
  }

  // Extract hostname
  const hostname = url.replace(/^(http|https):\/\/(www\.)?/, '').split('/')[0];

  // DNS lookup to validate domain
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if the URL already exists in the database
    const existingEntry = urlDatabase.find((entry) => entry.original_url === url);
    if (existingEntry) {
      return res.json({
        original_url: existingEntry.original_url,
        short_url: existingEntry.short_url,
      });
    }

    // Add a new entry
    const newEntry = {
      original_url: url,
      short_url: counter++,
    };
    urlDatabase.push(newEntry);

    res.json({ original_url: newEntry.original_url, short_url: newEntry.short_url });
  });
});

// GET endpoint to redirect to the original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const entry = urlDatabase.find((item) => item.short_url === shortUrl);
  if (entry) {
    return res.redirect(entry.original_url);
  } else {
    res.json({ error: 'No URL found' });
  }
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
