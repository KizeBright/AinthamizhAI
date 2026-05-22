import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="bg-black text-white p-4 flex gap-6">
      <Link to="/">Home</Link>
      <Link to="/translator">Translator</Link>
      <Link to="/entities">Entities</Link>
      <Link to="/sentence">Sentence</Link>
      <Link to="/pronunciation">Pronunciation</Link>
      <Link to="/ocr">OCR</Link>
      <Link to="/dashboard">Dashboard</Link>
    </div>
  );
}

export default Navbar;