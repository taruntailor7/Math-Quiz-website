const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true  // If you need to allow cookies (optional)
}));

const port = process.env.PORT || 5000;
const mongoUrl = process.env.MONGODB_URI;
console.log('port',port)
console.log('mongoUrl', mongoUrl);

// Connect to MongoDB for high-score tracking
mongoose.connect(mongoUrl).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => console.log('MongoDB connection error:', error));

let currentQuestion = generateQuestion();
let isAnswered = false;

// Question generator function
function generateQuestion() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { question: `${num1} + ${num2}`, answer: num1 + num2 };
}

// Handle socket connections
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Emit the initial question to the newly connected user
    socket.emit('newQuestion', { question: currentQuestion.question });

    socket.on('submitAnswer', (data) => {
        if (isAnswered) {
            return; // Ignore answers if the question has already been answered
        }

        if (data.answer === currentQuestion.answer) {
            isAnswered = true; 
            io.emit('winner', { user: socket.id }); // Broadcast winner message

            // Delay sending a new question by 3 seconds
            setTimeout(() => {
                currentQuestion = generateQuestion();
                isAnswered = false;
                io.emit('newQuestion', { question: currentQuestion.question });
            }, 3000);
        } else {
            socket.emit('incorrect'); // Notify only the user who answered wrong
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log('Server running on port:', port);
});
