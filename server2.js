const express = require("express");
const eobj = express()
const port = 5100;

const {MongoClient} = require("mongodb")
const URL = "mongodb+srv://Sandeshinde:Sanju_1530@clustersandesh.josps6l.mongodb.net/";
const client = new MongoClient(URL);

const cors = require("cors");
const { after } = require("server/plugins/final");
eobj.use(cors());
eobj.use(express.json());  // Required to parse JSON requests


//start the server
eobj.listen(port,function(){
    console.log("YOur server started succesfully");
});

eobj.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

  // Basic route
eobj.get("/", MarvellousGet);

function MarvellousGet(req, res) {
  res.send("Your Server is ON");
}

//Database COnnection function

async function GetConnection() {
    await client.connect(); //ensures client connect to the mongodb server
    const db = client.db("Sandesh") // Access the  " Marvellous" database
    return db.collection("Restaurent") // return the Restaurent collection from the above database
}

// Function to fetch data from the database
async function ReadData() {
    const collection = await GetConnection(); // Get the MongoDB collection
    const data = await collection.find().toArray(); // Fetch all documents as an array
    console.log("Data retrieved from database Marvellous");
    return data; // Return the fetched data
  }

  // Route to fetch Restaurents
  eobj.get("/posts",GetData );

  async function GetData (req, res)
   {
    const data = await ReadData(); // Fetch all documents
    if (data.length > 0) {
      res.json(data[0].posts); // Return only the `posts` array
    } else {
      res.json([]); // Return an empty array if no data
    }
  }

  /////////// Route to Add Restaurent

  eobj.post("/posts/Add/" , AddData )
  async function AddData(req , res)
  {
    const collection = await GetConnection();
    const new_Id = await GetCounter();
    console.log("new Id is :"+new_Id);
    const Restaurent = {
      ...req.body,
      id :  new_Id
  };
    console.log("Received data:", req.body); 


    const result = await collection.updateOne(
      {},
     {$push : { posts : Restaurent}} ,
     { upsert: true } // Create the document if it doesn't exist
    );


    if (result?.acknowledged) 
      {
      res.status(201).send(`Added a new restaurent: ID`);
      }
       else 
       {
      res.status(500).send("Failed to addd new restaurent.");
        }
  }


  /////////// Route to delete Restaurent by name
  eobj.delete("/posts/delete/:name",DeleteOne );
  async function DeleteOne(req,res)
  {
    const collection = await GetConnection();
    const nameX = req.params.name;

    const result = await collection.updateOne(
      { "posts.name" : nameX},
      {$pull : {posts : {name : nameX}}}
    );

    res.json({ message: 'Post deleted successfully', result });
    console.log(result);
  }


  /////////// Route to update Restaurent
  eobj.put("/posts/Update/:Id", UpdateOneX)
  async function UpdateOneX(req, res)
  {
    const collection = await GetConnection();
    const Id = req.params.Id;
    const updatedRestaurent = req.body;
    const result = await collection.updateOne(
      {"posts.id" : Id},
      {$set :{"posts.$" : updatedRestaurent} }  );

      if (result?.acknowledged) {
        res.status(201).send(`Added a new restaurent: ID ${result.insertedId}.`);
    } else 
    {
        res.status(500).send("Failed to addd new restaurent.");
    }
  }



  ///////gettting COunter collection for id and it s incrementation

  async function GetCounter()
  {
    await client.connect();
    const db = client.db("Sandesh");
    Countercollection = db.collection("Counter");
    console.log("Counter is :"+Countercollection);
    
    
    const Counter = await Countercollection.findOneAndUpdate(
      { },
      {$inc : {"sequence_value" : 1}},
      {upsert : true , returnDocument : "after"}

    );
    console.log("Counter Result:", JSON.stringify(Counter, null, 2));

  // ✅ Ensure Counter.value exists before accessing sequence_value
  if (!Counter || !Counter.sequence_value) {
    console.error("Counter update failed, fetching manually...");
    const newCounter = await Countercollection.findOne({});

    if (newCounter) {
      return newCounter.sequence_value;
    } else {
      throw new Error("Counter creation failed");
    }
  }

  return Counter.sequence_value;
  }

  /////////// Below code for the crud operations to signup users

 eobj.post("/signup/Adduser" , Adduser)
 
  async function Adduser(req , res)
 {
   const collection = await GetConnection();
    const new_user = req.body;

    const result  = await collection.updateOne(
      {},
      {$push : {signup : new_user}},
      {upsert : true}
    );

    if (result?.acknowledged) 
      {
      res.send("Added a new user succefully")
      }
       else 
       {
      res.send("Failed to add new user");
    }
    
  }
  
  
   eobj.post("/login/CheckUser" , CheckUser)
  
   async function CheckUser(req , res)
   {
        try {
          const collection = await GetConnection();
          const { email, password } = req.body;  // Extract email & password from body
          console.log(email , password);
  
          const user = await collection.findOne({ 
           signup:{
            $elemMatch:{email : email , password : password}
           }});
           
  
          if (user) {
              res.json({ success: true, message: "User found"});
          } else {
              res.json({ success: false, message: "Invalid credentials" });
          }
      } catch (error) {
          res.status(500).json({ success: false, message: "Server error", error });
      }
  }
  
