const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT;
const mongoUrl = process.env.MONGODB_URI;
console.log('port',port)
console.log('mongoUrl', mongoUrl);

// Connect to MongoDB for high-score tracking
mongoose.connect(mongoUrl);

// Question generator function
function generateQuestion() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { question: `${num1} + ${num2}`, answer: num1 + num2 };
}

// Handle socket connections
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send new question
    const question = generateQuestion();
    io.emit('newQuestion', question);

    // Handle answer submission
    socket.on('submitAnswer', (data) => {
        if (data.answer == question.answer) {
            io.emit('winner', { user: socket.id, answer: data.answer });
            question = generateQuestion(); // Generate a new question
            io.emit('newQuestion', question); // Broadcast new question
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log('Server running on port: ', port);
});
