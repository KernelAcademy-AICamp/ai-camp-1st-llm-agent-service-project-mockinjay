import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Community from './pages/Community';
import PostDetailPage from './pages/PostDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/community" element={<Community />} />
        <Route path="/community/:postId" element={<PostDetailPage />} />
        <Route path="/" element={<Community />} />
      </Routes>
    </Router>
  );
}

export default App;
