// Initialize a new Socket.io connection
const socket = io();

// Check if the browser supports geolocation
if (navigator.geolocation) {
    // Watch the user's location continuously with watchPosition
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Initialize the Leaflet map and set the initial view to coordinates (0, 0) with a zoom level of 16
const map = L.map("map").setView([0, 0], 16);

// Add OpenStreetMap tiles to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

// Object to store all markers on the map
const markers = {};
const userPositions = {}; // To store user positions for distance calculations

// Function to update distances and draw paths between users
function updateDistances() {
    const userIds = Object.keys(userPositions);
    const distanceLines = []; // Store distance lines

    // Calculate distances between all pairs of users
    for (let i = 0; i < userIds.length; i++) {
        for (let j = i + 1; j < userIds.length; j++) {
            const userA = userPositions[userIds[i]];
            const userB = userPositions[userIds[j]];
            const latlngs = [
                [userA.latitude, userA.longitude],
                [userB.latitude, userB.longitude]
            ];

            // Calculate the distance in meters and display it
            const distance = map.distance(latlngs[0], latlngs[1]);
            console.log(`Distance between ${userIds[i]} and ${userIds[j]}: ${distance.toFixed(2)} meters`);

            // Draw the line on the map
            distanceLines.push(L.polyline(latlngs, { color: 'blue', weight: 2 }).addTo(map));
        }
    }

    // Clear previous distance lines if needed (optional)
    // distanceLines.forEach(line => map.removeLayer(line));
}

// Listen for the "receive-location" event from the server
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // Update user positions
    userPositions[id] = { latitude, longitude };

    // Update the map's view to focus on the new location
    map.setView([latitude, longitude]);

    // Check if a marker for the user already exists on the map
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    // Update distances between users
    updateDistances();
});

// Listen for the "user-disconnected" event from the server
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
        delete userPositions[id]; // Remove user position on disconnect
        updateDistances(); // Update distances after a user disconnects
    }
});
