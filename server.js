const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 保存ファイルのパス
const DATA_PATH = 'stats.json';

// --- データの読み込み ---
let stats = {
    totalVisits: 0,
    totalClicks: 0,
    activeUsers: 0
};

if (fs.existsSync(DATA_PATH)) {
    try {
        const savedData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        stats.totalVisits = savedData.totalVisits || 0;
        stats.totalClicks = savedData.totalClicks || 0;
    } catch (err) {
        console.error("Failed to load stats:", err);
    }
}

// --- データの保存 ---
const saveStats = () => {
    try {
        const dataToSave = { ...stats, activeUsers: 0 };
        fs.writeFileSync(DATA_PATH, JSON.stringify(dataToSave), 'utf8');
    } catch (err) {
        console.error("Failed to save stats:", err);
    }
};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    stats.activeUsers++;
    stats.totalVisits++;
    saveStats();
    
    io.emit('statsUpdate', stats);

    socket.on('linkClicked', () => {
        stats.totalClicks++;
        saveStats();
        io.emit('statsUpdate', stats);
    });

    socket.on('disconnect', () => {
        stats.activeUsers = Math.max(0, stats.activeUsers - 1);
        io.emit('statsUpdate', stats);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
