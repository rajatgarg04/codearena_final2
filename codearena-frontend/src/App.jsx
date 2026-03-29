import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Setup from './pages/Setup'; // <-- Import the new page
import Lobby from './pages/Lobby';
import Arena from './pages/Arena';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup/:roomId" element={<Setup />} /> {/* <-- Add this route */}
        <Route path="/lobby/:roomId" element={<Lobby />} />
        <Route path="/arena/:roomId" element={<Arena />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;