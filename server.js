const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.post("/lock/:id", auth, async (req, res) => {
  const device = await Device.findByIdAndUpdate(
    req.params.id,
    { status: "locked" },
    { new: true }
  );

  io.emit("deviceUpdated", device); // 🔥 REAL-TIME
  res.json({ message: "Locked" });
});

server.listen(3000, () => console.log("Running"));

const Log = mongoose.model("Log", {
  action: String,
  device: String,
  time: String
});

await Log.create({
  action: "LOCK",
  device: req.params.id,
  time: new Date()
});