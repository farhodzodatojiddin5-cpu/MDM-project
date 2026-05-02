const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mdm";
mongoose.connect(dbUri)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

const Log = mongoose.models.Log || mongoose.model("Log", {
  action: String,
  device: String,
  time: Date
});

const Device = mongoose.models.Device || mongoose.model("Device", {
  name: String,
  status: String
});

const auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.get("/devices", auth, async (req, res) => {
  const devices = await Device.find();
  res.json(devices);
});

app.post("/lock/:id", auth, async (req, res) => {
  const device = await Device.findByIdAndUpdate(
    req.params.id,
    { status: "locked" },
    { new: true }
  );

  await Log.create({
    action: "LOCK",
    device: req.params.id,
    time: new Date()
  });

  io.emit("deviceUpdated", device); // 🔥 REAL-TIME
  res.json({ message: "Locked", device });
});

server.listen(3000, () => console.log("Running"));