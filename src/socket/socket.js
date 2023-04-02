const rootUrl = "https://nebuladev.net"; // TODO: Update to EduPlex subdomain
const socket = io(rootUrl, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

socket.on('connect', () => {
    console.log("Connected to EduPlex server.");
});
