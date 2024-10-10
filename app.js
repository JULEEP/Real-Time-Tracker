// Import required modules
const express = require('express');   // Express framework for building the server
const app = express();                // Create an instance of Express
const path = require('path');         // Path module for handling file and directory paths
const http = require('http');         // Core HTTP module to create the server

// Import Socket.io for real-time, bi-directional communication
const socketio = require('socket.io'); 
const server = http.createServer(app); // Create an HTTP server using Express
const io = socketio(server);           // Initialize Socket.io on the server

// Set the view engine to EJS (Embedded JavaScript templates)
app.set("view engine", "ejs");

// Serve static files (e.g., CSS, JS, images) from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Listen for new connections from clients
io.on("connection", function (socket) {
    console.log('A user connected:', socket.id);  // Log the connection of a new user

    // Listen for "send-location" event from the client (when a client sends their location)
    socket.on("send-location", function (data) {
        // Broadcast the location data to all connected clients, including the sender
        io.emit("receive-location", { id: socket.id, ...data });
        // `socket.id` is unique for each connected user, allowing you to identify them.
    });

    // Listen for "disconnect" event, triggered when a client disconnects
    socket.on("disconnect", function () {
        // Broadcast to all clients that a user has disconnected
        io.emit("user-disconnected", socket.id);
        console.log('User disconnected:', socket.id);
    });
});

// Serve the index.ejs file when a user visits the home route "/"
app.get("/", function (req, res) {
    res.render("index");  // Render the EJS template located in the "views" directory
});

// Start the server and listen on port 3000
server.listen(3000, function () {
    console.log('Server is running on http://localhost:3000');
});
