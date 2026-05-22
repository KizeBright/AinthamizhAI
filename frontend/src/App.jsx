import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Translator from "./pages/Translator";
import EntityRecognition from "./pages/EntityRecognition";
import SentenceGenerator from "./pages/SentenceGenerator";
import Pronunciation from "./pages/Pronunciation";
import OCRScanner from "./pages/OCRScanner";
import Dashboard from "./pages/Dashboard";

import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/translator" element={<Translator />} />
          <Route path="/entities" element={<EntityRecognition />} />
          <Route path="/sentence" element={<SentenceGenerator />} />
          <Route path="/pronunciation" element={<Pronunciation />} />
          <Route path="/ocr" element={<OCRScanner />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;