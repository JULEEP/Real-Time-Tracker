// Initialize a new Socket.io connection
const socket = io();

// Check if the browser supports geolocation
if (navigator.geolocation) {
    // Watch the user's location continuously with watchPosition
    navigator.geolocation.watchPosition(
        (position) => {
            // Destructure latitude and longitude from the position object
            const { latitude, longitude } = position.coords;

            // Emit an event to the server with the user's location data
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            // Handle any error that occurs while accessing geolocation
            console.error(error);
        },
        {
            enableHighAccuracy: true,  // Get high accuracy location updates (using GPS if possible)
            timeout: 5000,             // Timeout after 5 seconds if unable to get the position
            maximumAge: 0              // Always get fresh data
        }
    );
}

// Initialize the Leaflet map and set initial view to coordinates (0, 0) with zoom level 16
const map = L.map("map").setView([0, 0], 4);

// Add OpenStreetMap tiles to the map for displaying map layers
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

// Object to store all markers on the map, associated with user IDs
const markers = {};

// Variable to store the polyline (path) between two users
let polyline = null;

// Listen for the "receive-location" event from the server, providing location updates for all users
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // Set the map's view to focus on the new location
    map.setView([latitude, longitude]);

    // If marker exists for the user, update its position
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        // Otherwise, create a new marker for the user
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    // If at least two users are connected, draw a path between them
    const userIds = Object.keys(markers);
    if (userIds.length >= 2) {
        const user1 = markers[userIds[0]].getLatLng();
        const user2 = markers[userIds[1]].getLatLng();

        // If polyline already exists, remove it
        if (polyline) {
            map.removeLayer(polyline);
        }

        // Draw a path (polyline) between the two users
        polyline = L.polyline([user1, user2], { color: 'blue' }).addTo(map);

        // Calculate and display the distance between the two users
        const distance = user1.distanceTo(user2) / 1000; // Convert to kilometers
        L.popup()
            .setLatLng([(user1.lat + user2.lat) / 2, (user1.lng + user2.lng) / 2]) // Middle of the path
            .setContent(`Distance: ${distance.toFixed(2)} km`)
            .openOn(map);
    }
});

// Listen for the "user-disconnected" event when a user disconnects
socket.on("user-disconnected", (id) => {
    // Remove the user's marker and polyline (if it exists)
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }

    // Redraw polyline if more than one user is still connected
    const userIds = Object.keys(markers);
    if (userIds.length >= 2) {
        const user1 = markers[userIds[0]].getLatLng();
        const user2 = markers[userIds[1]].getLatLng();

        if (polyline) {
            map.removeLayer(polyline);
        }

        polyline = L.polyline([user1, user2], { color: 'blue' }).addTo(map);
    } else if (polyline) {
        map.removeLayer(polyline); // Remove the path if only one user remains
    }
});
