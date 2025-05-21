import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";
const app = express();
dotenv.config();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174",
    methods: ["GET", "PUT"],
  },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const port = process.env.PORT || 3000;
const DB = process.env.CONNECTION.replace("<PASSWORD>", process.env.PASSWORD);
mongoose.connect(DB).then(() => {
  console.log("DB connected");
});

// Define message schema & model
const messageSchema = new mongoose.Schema({
  room: String,
  author: String,
  message: String,
  time: String,
});

const Message = mongoose.model("Message", messageSchema);

// API to get messages by room
app.get("/messages/:room", async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room }).sort({
      _id: 1,
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User Id: ${socket.id} joined room: ${room}`);
  });

  socket.on("send_message", async (data) => {
    // Save message to DB
    const newMessage = new Message(data);
    await newMessage.save();

    // Emit to others in room
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
