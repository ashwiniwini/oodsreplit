const express = require('express');
const http = require('http');
const axios = require('axios');
const https = require('https');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');

const app = express();
const server = http.createServer(app);
const ioServer = new Server(server);

// The "Safety Bypass" for the certificate error
const agent = new https.Agent({ rejectUnauthorized: false });

app.get('/api/matches', async (req, res) => {
    try {
        const response = await axios.get('https://setyourdata.org:2053/getCricketMatches', { httpsAgent: agent });
        res.json(response.data.sport.body);
    } catch (e) {
        res.status(500).send("Error");
    }
});

ioServer.on('connection', (socket) => {
    socket.on('join-match', (matchId) => {
        const secretFeed = ioClient(process.env.TARGET_SOCKET, {
            transports: ['websocket'],
            rejectUnauthorized: false // This fixes the TLS connection issue
        });

        secretFeed.on('connect', () => {
            secretFeed.emit("joinEvent", matchId);
        });

        secretFeed.on("eventGetLiveEventsFancyData", (data) => {
            socket.emit('match-update', data);
        });
    });
});

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
server.listen(3000);
