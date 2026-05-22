import { useState } from "react";
import API from "../services/api";

function Translator() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  const translateText = async () => {
    try {
      const response = await API.post("/translate", {
        text,
      });

      setResult(response.data.output);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">
        Tanglish Translator
      </h1>

      <textarea
        className="border p-4 w-full"
        rows="5"
        placeholder="Type Tanglish..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={translateText}
        className="bg-blue-500 text-white px-6 py-2 mt-4"
      >
        Translate
      </button>

      <div className="mt-6 bg-white p-4 rounded">
        {result}
      </div>
    </div>
  );
}

export default Translator;