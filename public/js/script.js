// Initialize a new Socket.io connection
const socket = io();

// Check if the browser supports geolocation
if (navigator.geolocation) {
    // Watch the user's location continuously with watchPosition
    // It automatically updates the location when the user moves
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
            enableHighAccuracy: true,   // Get high accuracy location updates (using GPS if possible)
            timeout: 5000,              // Timeout after 5 seconds if unable to get the position
            maximumAge: 0               // Do not use cached positions, always get fresh data
        }
    );
}

// Initialize the Leaflet map and set the initial view to coordinates (0, 0) with a zoom level of 16
const map = L.map("map").setView([0, 0], 16);

// Add OpenStreetMap tiles to the map for displaying map layers
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"  // Attribution text to give credit to OpenStreetMap
}).addTo(map);

// Object to store all markers on the map, where each marker is associated with a user's ID
const markers = {};

// Listen for the "receive-location" event from the server, which provides location updates for all users
socket.on("receive-location", (data) => {
    // Destructure user ID, latitude, and longitude from the received data
    const { id, latitude, longitude } = data;

    // Update the map's view to focus on the new location
    map.setView([latitude, longitude]);

    // Check if a marker for the user already exists on the map
    if (markers[id]) {
        // If the marker exists, update its position with the new latitude and longitude
        markers[id].setLatLng([latitude, longitude]);
    } else {
        // If no marker exists for the user, create a new marker and add it to the map
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});

// Listen for the "user-disconnected" event from the server, triggered when a user disconnects
socket.on("user-disconnected", (id) => {
    // Check if the disconnected user's marker exists on the map
    if (markers[id]) {
        // Remove the user's marker from the map
        map.removeLayer(markers[id]);

        // Delete the marker from the markers object to free up memory
        delete markers[id];
    }
});
