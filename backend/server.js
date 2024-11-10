// Backend (server.js)
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true,
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"],
  },
});

const port = process.env.PORT || 5000;

// Game state management
class GameState {
  constructor() {
    this.currentQuestion = this.generateQuestion();
    this.locked = false;
    this.answeredBy = null;
  }

  generateQuestion() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return {
      num1,
      num2,
      question: `${num1} + ${num2}`,
      answer: num1 + num2
    };
  }

  checkAnswer(userAnswer) {
    return Number(userAnswer) === this.currentQuestion.answer;
  }

  newQuestion() {
    this.currentQuestion = this.generateQuestion();
    this.locked = false;
    this.answeredBy = null;
  }
}

const gameState = new GameState();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send current game state to newly connected user
  socket.emit("gameState", {
    question: gameState.currentQuestion.question,
    locked: gameState.locked,
    answeredBy: gameState.answeredBy,
    correctAnswer: gameState.locked ? gameState.currentQuestion.answer : null
  });

  // Log the current game state
  console.log("Current game state:", {
    question: gameState.currentQuestion.question,
    answer: gameState.currentQuestion.answer,
    locked: gameState.locked,
    answeredBy: gameState.answeredBy
  });

  socket.on("submitAnswer", (data) => {
    console.log(`Answer received from ${socket.id}:`, {
      receivedAnswer: data.answer,
      correctAnswer: gameState.currentQuestion.answer,
      locked: gameState.locked
    });

    // If game is locked, notify user
    if (gameState.locked) {
      socket.emit("alreadyAnswered", {
        answeredBy: gameState.answeredBy,
        correctAnswer: gameState.currentQuestion.answer
      });
      return;
    }

    const userAnswer = Number(data.answer);
    const correctAnswer = gameState.currentQuestion.answer;

    console.log("Comparing answers:", {
      userAnswer,
      correctAnswer,
      isCorrect: userAnswer === correctAnswer
    });

    if (userAnswer === correctAnswer) {
      // Mark question as answered
      gameState.locked = true;
      gameState.answeredBy = socket.id;

      // Notify all users about the winner
      io.emit("winner", {
        user: socket.id,
        correctAnswer: correctAnswer
      });

      // Set new question after delay
      setTimeout(() => {
        gameState.newQuestion();
        console.log("New question generated:", gameState.currentQuestion);
        io.emit("newQuestion", {
          question: gameState.currentQuestion.question
        });
      }, 3000);
    } else {
      socket.emit("incorrect");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log("Server running on port:", port);
});