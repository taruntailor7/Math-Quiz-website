import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Listen for the new question event from the server
        socket.on('newQuestion', (data) => {
            setQuestion(data.question);
            setMessage(''); // Clear any previous message for a new question
        });

        // Listen for the winner event and display the winner message
        socket.on('winner', (data) => {
            setMessage(`User ${data.user} answered correctly! New question in a few seconds...`);
        });

        // Listen for incorrect answers and display an error message
        socket.on('incorrect', () => {
            setMessage('Incorrect answer, try again!');
            
            // Clear the incorrect answer message after 2-3 seconds
            setTimeout(() => {
                setMessage('');
            }, 3000); // Clear after 3 seconds
        });

        // Clean up listeners on component unmount
        return () => {
            socket.off('newQuestion');
            socket.off('winner');
            socket.off('incorrect');
        };
    }, []);

    // Function to submit the answer
    const submitAnswer = () => {
        const parsedAnswer = parseInt(answer);
        if (isNaN(parsedAnswer)) {
            setMessage("Please enter a valid number.");
            return;
        }

        // Emit the answer to the server
        socket.emit('submitAnswer', { answer: parsedAnswer });
        setAnswer('');
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
