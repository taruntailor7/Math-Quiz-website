import React, { useEffect, useState } from "react";
import io from "socket.io-client";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://math-quiz-website.onrender.com", {
      transports: ["websocket"],
      cors: {
        withCredentials: true,
      }
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Connected with ID:", newSocket.id);
      setSocketId(newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setMessage("Connection error. Please refresh the page.");
    });

    setSocket(newSocket);

    // Game state event handlers
    newSocket.on("gameState", (data) => {
      console.log("Received game state:", data);
      setQuestion(data.question);
      setIsLocked(data.locked);
      if (data.locked) {
        setMessage(`User ${data.answeredBy} answered this question correctly with ${data.correctAnswer}. Wait for next question...`);
      }
    });

    newSocket.on("newQuestion", (data) => {
      console.log("New question received:", data);
      setQuestion(data.question);
      setMessage("");
      setIsLocked(false);
      setAnswer("");
    });

    newSocket.on("winner", (data) => {
      console.log("Winner event:", data);
      setIsLocked(true);
      const winnerMessage = data.user === newSocket.id 
        ? `You answered correctly with ${data.correctAnswer}! New question coming soon...`
        : `User ${data.user} answered correctly with ${data.correctAnswer}! New question coming soon...`;
      setMessage(winnerMessage);
    });

    newSocket.on("incorrect", () => {
      console.log("Incorrect answer");
      setMessage("Incorrect answer, try again!");
      setTimeout(() => {
        if (!isLocked) {
          setMessage("");
        }
      }, 2000);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!socket || isLocked || !answer) return;

    const numAnswer = Number(answer);
    if (isNaN(numAnswer)) {
      setMessage("Please enter a valid number");
      return;
    }

    console.log("Submitting answer:", numAnswer);
    socket.emit("submitAnswer", { answer: numAnswer });
    setAnswer("");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Math Quiz</h1>
        
        <div className="text-sm text-gray-500 mb-4">
          Your ID: {socketId || 'Connecting...'}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Question:</h2>
          <p className="text-lg">{question || 'Loading...'}</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
              disabled={isLocked}
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              disabled={isLocked}
              className={`px-4 py-2 rounded font-medium ${
                isLocked 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Submit
            </button>
          </div>
        </form>

        {message && (
          <div className={`p-3 rounded ${
            message.includes('correctly') 
              ? 'bg-green-100 text-green-700' 
              : message.includes('error')
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;