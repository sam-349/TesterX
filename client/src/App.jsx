import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CreateQuiz from './components/CreateQuiz';
import Lobby from './components/Lobby';
import JoinQuiz from './components/JoinQuiz';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateQuiz />} />
        <Route path="/lobby/:roomId" element={<Lobby />} />
        <Route path="/join/:roomId" element={<Lobby />} />
        <Route path="/join" element={<JoinQuiz />} />
      </Routes>
    </Router>
  );
}

export default App;
