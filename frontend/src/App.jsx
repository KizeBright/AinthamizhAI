import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import TanglishTranslator from "./pages/TanglishTranslator";
import EntityAnalyzer from "./pages/EntityAnalyzer";
import SentenceGenerator from "./pages/SentenceGenerator";
import PronunciationValidator from "./pages/PronunciationValidator";
import OCRScanner from "./pages/OCRScanner";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

import Navbar from "./components/Navbar";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Navbar />

        <main className="min-h-screen bg-[#FAFAFA]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/translator" element={<TanglishTranslator />} />
            <Route path="/entities" element={<EntityAnalyzer />} />
            <Route path="/sentence" element={<SentenceGenerator />} />
            <Route path="/pronunciation" element={<PronunciationValidator />} />
            <Route path="/ocr" element={<OCRScanner />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
