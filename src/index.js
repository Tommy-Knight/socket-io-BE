import RoomModel from "./models/Room/index.js";
import { Server } from "socket.io";
import chatRouter from "./services/Chat.js";
import cors from "cors";
import { createServer } from "http";
import express from "express";
import list from "express-list-endpoints";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, { allowEIO3: true });

let onlineUsers = [];

io.on("connection", (socket) => {
	console.log("id🍕", socket.id);

	console.log("rooms🍒", socket.rooms);
io.sockets.emit("hello there");

	socket.broadcast.emit("yay");
	socket.on("login", ({ username, room }) => {
		onlineUsers.push({ username: username, id: socket.id, room });

		//.emit - echoing back to itself
		socket.emit("loggedin");

		//.broadcast.emit - emitting to everyone else
		socket.broadcast.emit("newConnection");

		socket.join(room);

		console.log(socket.rooms);

		//io.sockets.emit - emitting to everybody in the known world
	});

	socket.on("disconnect", () => {
		console.log("Disconnecting...");
		onlineUsers = onlineUsers.filter((user) => user.id !== socket.id);
	});

	socket.on("sendMessage", async ({ message, room }) => {
		await RoomModel.findOneAndUpdate(
			{ name: room },
			{
				$push: { chatHistory: message },
			}
		);

		socket.to(room).emit("message", message);
	});
});

app.get("/online-users", (req, res) => {
	res.status(200).send({ onlineUsers });
});

app.use("/", chatRouter);

const port = 3030;

mongoose.connect(process.env.ATLAS_URL, { useNewUrlParser: true }).then(() => {
	console.log("Connected to mongo");
	// Listen using the httpServer -
	// listening with the express instance will start a new one
	server.listen(port, () => {
		console.table(list(app));
		console.log("Server listening on port " + port);
	});
});
