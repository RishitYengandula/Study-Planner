import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";

function App() {
  const [goal, setGoal] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  // 🎤 Voice Input
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setGoal((prev) => prev + " " + speechText);
    };
  };

  // 📎 File Upload
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setGoal((prev) => prev + "\n" + event.target.result);
    };
    reader.readAsText(file);
  };

  // 🔥 API CALL
  async function generatePlan() {
    if (!goal.trim()) return;

    const userMessage = { role: "user", content: goal };
    setMessages((prev) => [...prev, userMessage]);
    setGoal("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer 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",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Nova Planner",
          },
          body: JSON.stringify({
            model: "openrouter/auto",
            messages: [
              {
                role: "user",
                content: `Create a structured 30-day plan for:\n${goal}\nUse markdown headings, bullet points and clean formatting.`,
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) throw new Error("API failed");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: text },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ API failed" },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="app">
      <h1 className="title">Nova Planner 🚀</h1>

      <div className="chat">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={`msg ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </motion.div>
        ))}

        {loading && (
          <div className="msg assistant typing">
            <span></span><span></span><span></span>
          </div>
        )}
      </div>

      {/* INPUT BAR */}
      <div className="inputBox">
        <button className="iconBtn" onClick={startListening}>🎤</button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={goal}
          placeholder="What do you want to master?"
          onChange={(e) => {
            setGoal(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              generatePlan();
            }
          }}
        />

        <label className="iconBtn">
          📎
          <input type="file" hidden onChange={handleFile} />
        </label>

        <button className="sendBtn" onClick={generatePlan}>
          ➤
        </button>
      </div>
    </div>
  );
}

export default App;