const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const DATA_PATH = 'stats.json';

let stats = { totalVisits: 0, totalClicks: 0, activeUsers: 0 };
if (fs.existsSync(DATA_PATH)) {
    try { stats = { ...stats, ...JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) }; } catch (e) { console.error(e); }
}

const save = () => {
    try { fs.writeFileSync(DATA_PATH, JSON.stringify({ ...stats, activeUsers: 0 })); } catch (e) { console.error(e); }
};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    stats.activeUsers++;
    stats.totalVisits++;
    save();
    io.emit('statsUpdate', stats);

    socket.on('linkClicked', () => {
        stats.totalClicks++;
        save();
        io.emit('statsUpdate', stats);
    });

    socket.on('disconnect', () => {
        stats.activeUsers = Math.max(0, stats.activeUsers - 1);
        io.emit('statsUpdate', stats);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
