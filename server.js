require('dotenv').config(); // For local environment variables
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5100;

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Sandeshinde:Sanju_1530@clustersandesh.josps6l.mongodb.net/";
const FRONTEND_URL = "https://vercel-frontend-5bxh.vercel.app"; 


// MongoDB client with connection pooling
const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });
  
  // CORS configuration
  const corsOptions = {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
    credentials: true
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());
  
  // [Rest of your code remains exactly the same as in the previous complete version]
  // ... all your routes and functions ...
  
  // Export for Vercel
  module.exports = app;
  
  // Start server locally if not in Vercel environment
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  
// Database connection function with error handling
async function GetConnection() {
  try {
    if (!client.isConnected()) {
      await client.connect();
    }
    const db = client.db("Sandesh");
    return db.collection("Restaurent");
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;
  }
}

// Health check route
app.get("/", (req, res) => {
  res.send("Your Server is ON");
});

// Route to fetch restaurants
app.get("/posts", async (req, res) => {
  try {
    const collection = await GetConnection();
    const data = await collection.find().toArray();
    res.json(data.length > 0 ? data[0].posts : []);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Route to add restaurant
app.post("/posts/Add", async (req, res) => {
  try {
    const collection = await GetConnection();
    const new_Id = await GetCounter();
    const restaurant = {
      ...req.body,
      id: new_Id
    };

    const result = await collection.updateOne(
      {},
      { $push: { posts: restaurant } },
      { upsert: true }
    );

    if (result?.acknowledged) {
      res.status(201).send(`Added a new restaurant with ID: ${new_Id}`);
    } else {
      res.status(500).send("Failed to add new restaurant.");
    }
  } catch (err) {
    console.error("Error adding restaurant:", err);
    res.status(500).send("Internal server error");
  }
});

// Route to delete restaurant by name
app.delete("/posts/delete/:name", async (req, res) => {
  try {
    const collection = await GetConnection();
    const nameX = req.params.name;

    const result = await collection.updateOne(
      { "posts.name": nameX },
      { $pull: { posts: { name: nameX } } }
    );

    res.json({ message: 'Restaurant deleted successfully', result });
  } catch (err) {
    console.error("Error deleting restaurant:", err);
    res.status(500).json({ error: "Failed to delete restaurant" });
  }
});

// Route to update restaurant
app.put("/posts/Update/:Id", async (req, res) => {
  try {
    const collection = await GetConnection();
    const Id = req.params.Id;
    const updatedRestaurant = req.body;

    const result = await collection.updateOne(
      { "posts.id": Id },
      { $set: { "posts.$": updatedRestaurant } }
    );

    if (result?.acknowledged) {
      res.status(200).send(`Restaurant with ID ${Id} updated successfully.`);
    } else {
      res.status(500).send("Failed to update restaurant.");
    }
  } catch (err) {
    console.error("Error updating restaurant:", err);
    res.status(500).send("Internal server error");
  }
});

// Counter function for ID generation
async function GetCounter() {
  try {
    const db = client.db("Sandesh");
    const Countercollection = db.collection("Counter");
    
    const Counter = await Countercollection.findOneAndUpdate(
      {},
      { $inc: { "sequence_value": 1 } },
      { upsert: true, returnDocument: "after" }
    );

    if (!Counter || !Counter.sequence_value) {
      const newCounter = await Countercollection.findOne({});
      if (newCounter) {
        return newCounter.sequence_value;
      } else {
        throw new Error("Counter creation failed");
      }
    }

    return Counter.sequence_value;
  } catch (err) {
    console.error("Error getting counter:", err);
    throw err;
  }
}

// User signup
app.post("/signup/Adduser", async (req, res) => {
  try {
    const collection = await GetConnection();
    const new_user = req.body;

    const result = await collection.updateOne(
      {},
      { $push: { signup: new_user } },
      { upsert: true }
    );

    if (result?.acknowledged) {
      res.status(201).send("Added a new user successfully");
    } else {
      res.status(500).send("Failed to add new user");
    }
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).send("Internal server error");
  }
});

// User login
app.post("/login/CheckUser", async (req, res) => {
  try {
    const collection = await GetConnection();
    const { email, password } = req.body;

    const user = await collection.findOne({ 
      signup: {
        $elemMatch: { email: email, password: password }
      }
    });

    if (user) {
      res.json({ success: true, message: "User found" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Export for Vercel
module.exports = app;

// Start server locally if not in Vercel environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}