const mongoose = require("mongoose");
const User = require("./models/User");

const uri = "mongodb+srv://ronitsaini940_db_user:uzYaTfLndu5eShLg@cluster0.qwppqyw.mongodb.net/talkflow?appName=Cluster0";

async function run() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");
    
    const users = await User.find({}, "name email createdAt");
    console.log("Registered Users count:", users.length);
    console.log(JSON.stringify(users, null, 2));
    
    await mongoose.connection.close();
  } catch (err) {
    console.error("Error listing users:", err);
  }
}

run();
