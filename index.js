// Init project
var express = require("express");
var app = express();
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
const dns = require('dns');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const URLSchema = new mongoose.Schema({
  original_url: {type: String, required: true, unique: true},
  short_url: {type: String, required: true, unique: true}
});

let URLModel = mongoose.model("url", URLSchema);

// Middleware function to parse post requests
app.use("/", bodyParser.urlencoded({ extended: false }));

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


app.get('/api/shorturl/:short_url', function(req, res) {
  let short_url = req.params.short_url;
  // Find the original url from the database
  URLModel.findOne({short_url: short_url}).then((foundURL) => {
    if (foundURL){
      let original_url = foundURL.original_url;
      res.redirect(original_url);
    } else {
      res.json({message: "The short url does not exist!"});
    }
  });
})

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  let url = req.body.url;
  // Validate the URL
  try {
    urlObj = new URL(url);
    // Validate DNS Domain
    dns.lookup(urlObj.hostname, (err, address, family) => {
      // If the DNS domain does not exist no address returned
      if (!address){
        res.json({ error: 'invalid url' })
      } 
      // We have a valid URL!
      else {
        let original_url = urlObj.href;
        // Check that URL does not already exist in database 
        URLModel.findOne({original_url: original_url}).then(
          (foundURL) => {
            if (foundURL) {
              res.json(
                {
                  original_url: foundURL.original_url,
                  short_url: foundURL.short_url
                })
          } 
          // If URL does not exist create a new short url and 
          // add it to the database
          else {
            let short_url = 1;
            // Get the latest short_url
            URLModel.find({}).sort(
              {short_url: "desc"}).limit(1).then(
                (latestURL) => {
                if (latestURL.length > 0){
                  // Increment the latest short url by adding 1
                  short_url = parseInt(latestURL[0].short_url) + 1;
                }
                resObj = {
                  original_url: original_url,
                  short_url: short_url
                }
                
                // Create an entry in the database
                let newURL = new URLModel(resObj);
                newURL.save();
                res.json(resObj);
                }
            )
          }
        })
      }
    })
  }
  // If the url has an invalid format
  catch {
    res.json({ error: 'invalid url' })
  }
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
