
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

import './App.css';

function Home() {
  return (
    <>
      <Navbar />
      <h1>Welcome to TutorHub</h1>
      <p>Find the right tutor and achieve your learning goals.</p>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
