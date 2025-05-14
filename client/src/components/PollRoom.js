// client/src/components/PollRoom.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/PollRoom.css';

// Socket connection
const socket = io('https://livepoll-assignment.onrender.com');

function PollRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [pollData, setPollData] = useState(null);
  const [username, setUsername] = useState('');
  const [userVoted, setUserVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize room data
  useEffect(() => {
    // Check if user info exists in local storage
    const storedUserData = localStorage.getItem('pollUser');
    
    if (!storedUserData) {
      // Redirect to home if no user info
      navigate('/');
      return;
    }
    
    const userData = JSON.parse(storedUserData);
    
    // Verify if the stored roomId matches the current roomId
    if (userData.roomId !== roomId) {
      // Redirect if room IDs don't match
      navigate('/');
      return;
    }
    
    setUsername(userData.username);
    
    // Join the room
    socket.emit('join_room', { roomId, username: userData.username });
    
    // Listen for room join response
    socket.once('room_joined', ({ pollData }) => {
      setPollData(pollData);
      
      // Check if user already voted
      if (pollData.userVotes[userData.username] !== undefined) {
        setUserVoted(true);
        setUserVote(pollData.userVotes[userData.username]);
      }
      
      // Calculate time left
      const secondsLeft = Math.max(0, Math.floor((pollData.endTime - Date.now()) / 1000));
      setTimeLeft(secondsLeft);
      
      setIsLoading(false);
    });
    
    // Listen for error response
    socket.once('error', ({ message }) => {
      setError(message);
      setIsLoading(false);
    });
    
    // Listen for vote updates
    socket.on('vote_update', ({ pollData }) => {
      setPollData(pollData);
      
      // Check if user already voted
      if (pollData.userVotes[userData.username] !== undefined) {
        setUserVoted(true);
        setUserVote(pollData.userVotes[userData.username]);
      }
    });
    
    // Listen for poll end
    socket.on('poll_ended', ({ pollData }) => {
      setPollData(pollData);
      setTimeLeft(0);
    });
    
    return () => {
      socket.off('vote_update');
      socket.off('poll_ended');
    };
  }, [roomId, navigate]);
  
  // Timer effect
  useEffect(() => {
    if (!pollData || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
      
      // Check poll status every second
      socket.emit('check_poll_status', { roomId });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [pollData, roomId]);
  
  // Handle vote submission
  const handleVote = (optionIndex) => {
    if (userVoted || !pollData.active || timeLeft <= 0) {
      return;
    }
    
    socket.emit('submit_vote', { roomId, username, optionIndex });
    
    // Save vote to local storage
    const userData = JSON.parse(localStorage.getItem('pollUser'));
    localStorage.setItem('pollUser', JSON.stringify({
      ...userData,
      vote: optionIndex
    }));
    
    setUserVoted(true);
    setUserVote(optionIndex);
  };
  
  // Handle exit room
  const handleExit = () => {
    localStorage.removeItem('pollUser');
    navigate('/');
  };
  
  // Calculate vote percentages
  const calculatePercentage = (voteCount, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  };
  
  if (isLoading) {
    return <div className="loading">Loading poll data...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Home
        </button>
      </div>
    );
  }
  
  if (!pollData) {
    return (
      <div className="error-container">
        <h2>Poll not found</h2>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Home
        </button>
      </div>
    );
  }
  
  const totalVotes = pollData.votes[0] + pollData.votes[1];
  const option0Percentage = calculatePercentage(pollData.votes[0], totalVotes);
  const option1Percentage = calculatePercentage(pollData.votes[1], totalVotes);
  
  return (
    <div className="poll-room-container">
      <div className="poll-header">
        <h2>{pollData.question}</h2>
        <div className="room-info">
          <span>Room: <strong>{roomId}</strong></span>
          <span className="username">User: <strong>{username}</strong></span>
        </div>
        <div className="timer">
          Time remaining: <strong>{timeLeft} seconds</strong>
        </div>
      </div>
      
      <div className="poll-options">
        <div 
          className={`poll-option ${userVote === 0 ? 'selected' : ''}`}
          onClick={() => handleVote(0)}
        >
          <div className="option-header">
            <h3>{pollData.options[0]}</h3>
            <span className="vote-count">{pollData.votes[0]} votes</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${option0Percentage}%` }}
            ></div>
          </div>
          <div className="percentage">{option0Percentage}%</div>
        </div>
        
        <div 
          className={`poll-option ${userVote === 1 ? 'selected' : ''}`}
          onClick={() => handleVote(1)}
        >
          <div className="option-header">
            <h3>{pollData.options[1]}</h3>
            <span className="vote-count">{pollData.votes[1]} votes</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${option1Percentage}%` }}
            ></div>
          </div>
          <div className="percentage">{option1Percentage}%</div>
        </div>
      </div>
      
      <div className="poll-status">
        {!pollData.active || timeLeft <= 0 ? (
          <div className="poll-ended">
            <h3>Poll has ended</h3>
            <p>The winner is: <strong>
              {totalVotes === 0 ? 'No votes' : 
                pollData.votes[0] > pollData.votes[1] ? pollData.options[0] : 
                pollData.votes[0] < pollData.votes[1] ? pollData.options[1] : 
                'It\'s a tie!'}
            </strong></p>
          </div>
        ) : userVoted ? (
          <div className="voted-message">
            You voted for <strong>{pollData.options[userVote]}</strong>
          </div>
        ) : (
          <div className="instruction">Click on an option to vote</div>
        )}
      </div>
      
      <div className="total-votes">
        Total votes: <strong>{totalVotes}</strong>
      </div>
      
      <button onClick={handleExit} className="btn-exit">
        Exit Poll Room
      </button>
    </div>
  );
}

export default PollRoom;