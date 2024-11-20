const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/User'); // Import User model

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files

// MongoDB URI (replace with your MongoDB URI if using MongoDB Atlas)
const dbURI = 'mongodb://mongo:27017/nodejs-mongo-app'; // Using 'mongo' for Docker container name
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Serve the index page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Handle the form submission to store user details
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send('Email already exists');
    }

    // Create a new user
    const newUser = new User({
      name,
      email,
      password
    });

    // Save the new user to the database
    await newUser.save();
    res.send('User registered successfully');
  } catch (err) {
    console.error(err);
    res.send('Error occurred during registration');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

