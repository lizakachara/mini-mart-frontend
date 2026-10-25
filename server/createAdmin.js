require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@minimart.com";
    const password = "admin123";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("An account with this email already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: "Mini Mart Admin",
      email,
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    console.log("Admin account created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Error creating admin:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
