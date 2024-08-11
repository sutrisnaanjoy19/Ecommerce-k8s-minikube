const express = require("express");
const mongoose = require("mongoose");
const amqp = require("amqplib/callback_api");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors());

// MongoDB setup
mongoose.connect(
  `mongodb://${
    process.env.MONGO_USER
      ? [process.env.MONGO_USER, ":", process.env.MONGO_PASSWORD, "@"].join("")
      : ""
  }${process.env.MONGO_HOSTNAME || "mongo"}:${
    process.env.MONGO_PORT || 27017
  }/${process.env.MONGO_DBNAME || "ecommerce"}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
});

const Product = mongoose.model("Product", productSchema);

// RabbitMQ setup
let channel = null;
amqp.connect(
  `amqp://${
    process.env.RABBITMQ_USER
      ? [
          process.env.RABBITMQ_USER,
          ":",
          process.env.RABBITMQ_PASSWORD,
          "@",
        ].join("")
      : ""
  }${process.env.RABBITMQ_HOSTNAME || "rabbitmq"}`,
  (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, ch) => {
      if (error1) {
        throw error1;
      }
      channel = ch;
      channel.assertQueue("orderQueue", { durable: false });
    });
  }
);

// API Endpoints
app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post("/api/order", (req, res) => {
  const { productId } = req.body;
  channel.sendToQueue("orderQueue", Buffer.from(JSON.stringify({ productId })));
  res.json({ message: "Order placed successfully!" });
});

// Seed initial data
app.post("/api/seed", async (req, res) => {
  console.log("Database seeded!");
  await Product.deleteMany({});
  await Product.insertMany([
    { name: "Product A", price: 29.99 },
    { name: "Product B", price: 39.99 },
    { name: "Product C", price: 49.99 },
  ]);
  res.json({ message: "Database seeded!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
