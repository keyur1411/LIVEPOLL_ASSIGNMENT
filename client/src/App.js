// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import PollRoom from './components/PollRoom';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <h1 className="app-title">Live Poll Battle</h1>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<PollRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;