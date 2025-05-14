// client/src/components/Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/Home.css';

// Socket connection
const socket = io('https://livepoll-assignment-1gf5.vercel.app/');

function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');

  // Handle username input validation
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (error && e.target.value.trim()) {
      setError('');
    }
  };

  // Create a new poll room
  const handleCreateRoom = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    const finalQuestion = question.trim() || 'Cats vs Dogs';
    const options = [
      optionA.trim() || 'Cats', 
      optionB.trim() || 'Dogs'
    ];

    socket.emit('create_room', { username, question: finalQuestion, options });

    // Setup listener for room creation response
    socket.once('room_created', ({ roomId }) => {
      // Save user info to local storage
      localStorage.setItem('pollUser', JSON.stringify({ 
        username, 
        roomId 
      }));
      
      // Navigate to the poll room
      navigate(`/room/${roomId}`);
    });
  };

  // Join an existing poll room
  const handleJoinRoom = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!roomId.trim()) {
      setError('Please enter a room code');
      return;
    }

    socket.emit('join_room', { roomId, username });

    // Setup listener for room join response
    socket.once('room_joined', ({ roomId, pollData }) => {
      // Save user info to local storage
      localStorage.setItem('pollUser', JSON.stringify({ 
        username, 
        roomId 
      }));
      
      // Navigate to the poll room
      navigate(`/room/${roomId}`);
    });

    // Handle error response
    socket.once('error', ({ message }) => {
      setError(message);
    });
  };

  return (
    <div className="home-container">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab('join')}
        >
          Join a Poll
        </button>
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create a Poll
        </button>
      </div>

      <div className="form-container">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username">Your Name:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter your name"
            required
          />
        </div>

        {activeTab === 'join' ? (
          <form onSubmit={handleJoinRoom}>
            <div className="form-group">
              <label htmlFor="roomId">Room Code:</label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room code"
                required
              />
            </div>
            <button type="submit" className="btn-primary">Join Poll Room</button>
          </form>
        ) : (
          <form onSubmit={handleCreateRoom}>
            <div className="form-group">
              <label htmlFor="question">Question (optional):</label>
              <input
                type="text"
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., Cats vs Dogs"
              />
            </div>
            <div className="form-group">
              <label htmlFor="optionA">Option A (optional):</label>
              <input
                type="text"
                id="optionA"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="E.g., Cats"
              />
            </div>
            <div className="form-group">
              <label htmlFor="optionB">Option B (optional):</label>
              <input
                type="text"
                id="optionB"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="E.g., Dogs"
              />
            </div>
            <button type="submit" className="btn-primary">Create Poll Room</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Home;