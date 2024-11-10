import React, { useEffect, useState } from "react";
import io from "socket.io-client";

// const socket = io("https://math-quiz-website.onrender.com");

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket with proper configuration
    const newSocket = io("https://math-quiz-website.onrender.com", {
      transports: ["websocket", "polling"],
      cors: {
        withCredentials: true,
      },
    });

    // Set socket in state
    setSocket(newSocket);

    // Listen for the new question event from the server
    newSocket.on("newQuestion", (data) => {
      setQuestion(data.question);
      setMessage("");
    });

    // Listen for the winner event and display the winner message
    newSocket.on("winner", (data) => {
      setMessage(
        `User ${data.user} answered correctly! New question in a few seconds...`
      );
    });

    // Listen for incorrect answers and display an error message
    newSocket.on("incorrect", () => {
      setMessage("Incorrect answer, try again!");

      // Clear the incorrect answer message after 2-3 seconds
      setTimeout(() => {
        setMessage("");
      }, 3000);
    });

    // Clean up listeners on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Function to submit the answer
  const submitAnswer = () => {
    if (!socket) return;

    const parsedAnswer = parseInt(answer);
    if (isNaN(parsedAnswer)) {
      setMessage("Please enter a valid number.");
      return;
    }

    socket.emit("submitAnswer", { answer: parsedAnswer });
    setAnswer("");
  };

  return (
    <div>
      <h1>Math Quiz</h1>
      <p>Question: {question}</p>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter your answer"
      />
      <button onClick={submitAnswer}>Submit Answer</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
