import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import ResearchWorkspace from './pages/ResearchWorkspace';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/research/:researchId" element={<ResearchWorkspace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;