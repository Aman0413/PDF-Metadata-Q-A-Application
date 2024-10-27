import "./App.css"; // Ensure your Tailwind CSS is imported here
import { IoIosAddCircleOutline } from "react-icons/io";
import { LuSendHorizonal } from "react-icons/lu";
import axios from "axios";
import { useState } from "react";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state for upload and question submission

  const handlePdfUpload = (event) => {
    setPdfFile(event.target.files[0]);
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();

    // Check if a PDF file is uploaded
    if (!pdfFile) {
      alert("Please upload a PDF file first.");
      return;
    }

    // Start loading
    setLoading(true);

    // Upload the PDF file
    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      await axios.post("http://localhost:8000/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert("Error uploading PDF. Please try again.");
      setLoading(false); // Stop loading on error
      return;
    }

    // Now, ask the question
    const requestBody = {
      filename: pdfFile.name,
      question: question,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/ask/",
        requestBody
      );
      const answer = response.data.answer;

      // Update chat history
      setChatHistory((prevHistory) => [...prevHistory, { question, answer }]);

      // Clear question input
      setQuestion("");
    } catch (error) {
      console.error("Error asking question:", error.response.data);
      alert("Error asking question: " + error.response.data.error);
    } finally {
      setLoading(false); // Stop loading once the question is processed
    }
  };

  // Function to handle Enter key press in the input field
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleQuestionSubmit(event);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <div className="flex justify-between items-center px-5 py-3 shadow-2xl bg-white">
        <div className="text-lg font-semibold">AI Planet</div>
        <div>
          <label className="flex justify-center items-center space-x-1 cursor-pointer border border-dashed border-gray-300 bg-white text-sm transition hover:border-gray-400 focus:border-solid focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 py-2 px-3">
            <IoIosAddCircleOutline className="text-2xl text-gray-600" />
            <span className="text-xs font-medium text-gray-600 hidden md:block">
              {pdfFile ? pdfFile.name : "Upload PDF"}
            </span>
            <input
              id="photo-dropbox"
              type="file"
              className="sr-only"
              onChange={handlePdfUpload}
            />
          </label>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow p-4 overflow-y-auto border border-gray-300 rounded-lg shadow-md bg-gray-50">
        {chatHistory.map((chat, index) => (
          <div key={index} className="mb-4">
            {/* Question Box */}
            <div className="p-4 bg-blue-100 rounded-lg text-blue-800">
              <strong>Q:</strong> {chat.question}
            </div>
            {/* Answer Box */}
            <div className="p-4 mt-2 bg-green-100 rounded-lg text-green-800">
              <strong>A:</strong> {chat.answer}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-center p-4 bg-yellow-100 rounded-lg text-yellow-800">
            Loading... Please wait.
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown} // Handle Enter key press
            className="h-14 w-full p-2 rounded-lg z-0 focus:outline-none bg-gray-200 border border-gray-300 shadow-xl text-sm text-gray-500"
            placeholder="Send Message..."
          />
          <div className="absolute top-2 right-2">
            <button
              className={`h-10 w-20 text-white rounded-lg flex justify-center items-center ${
                loading ? "bg-gray-400" : "bg-blue-600"
              }`}
              onClick={handleQuestionSubmit}
              disabled={loading} // Disable button when loading
            >
              <LuSendHorizonal className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
