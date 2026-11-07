import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import './App.css';
import ReactMarkdown from "react-markdown"
function App() {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Hal state bas lal design ta na3ref eza nazzalna l input la tahet
  const [isChatActive, setIsChatActive] = useState(false); 
  // La n7faz el message taba3 l user bel design
  const [userMessage, setUserMessage] = useState(''); 

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter(
      (file): file is File => file instanceof File,
    );
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files ?? []).filter(
      (file): file is File => file instanceof File,
    );
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!prompt.trim() && files.length === 0) return;

    // Bas yeb3at, mna3mel l chat active w mnsayiv el message l zahi
    setIsChatActive(true);
    setUserMessage(prompt);
    setLoading(true);
    setOutput('');

    try {
      let uploadedNames: string[] = [];

      if (files.length > 0) {
        const uploads = await Promise.all(
          files.map(async (file) => {
            const form = new FormData();
            form.append("file", file);

            const r = await fetch("/api/upload", {
              method: "POST",
              body: form,
            });

            if (!r.ok) return null;
            const json = await r.json();
            return json?.file?.filename ?? null;
          })
        );

        uploadedNames = uploads.filter((n): n is string => !!n);
      }

      const messageToSend = prompt.trim()
        ? `${prompt}\n\nAttached files: ${uploadedNames.join(", ")}`
        : `Please analyze attached files: ${uploadedNames.join(", ")}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setOutput(data.reply || "No response");
    } catch (error) {
      setOutput(error instanceof Error ? `❌ ${error.message}` : '❌ Error contacting server');
    } finally {
      setLoading(false);
      setPrompt(''); // Mnafade l input box 
      setFiles([]);  // Mnafade l files ba3d l send
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="gpt-app-container">
      {/* El main chat area */}
      <main className={`chat-main ${!isChatActive ? 'centered' : ''}`}>
        
        {!isChatActive ? (
          <div className="hero-section">
            <div className="hero-logo">🤖</div>
            <h1>Kif fiyye se3dak lyom?</h1>
          </div>
        ) : (
          <div className="chat-history">
            {/* User Message Bubble */}
            {userMessage && (
              <div className="message-row user-row">
                <div className="message-bubble user-bubble">
                  {userMessage}
                </div>
              </div>
            )}

            {/* AI Response Bubble */}
            {(loading || output) && (
              <div className="message-row ai-row">
                <div className="ai-avatar">🤖</div>
                <div className="message-bubble ai-bubble">
                  {loading ? (
                    <span className="blinking-cursor">Thinking...</span>
                  ) : (
                    <div className="output-text markdown-body">
  <ReactMarkdown>{output}</ReactMarkdown>
</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* El Input Area lli byenzel la tahet */}
      <div className="input-section">
        <div className="input-wrapper">
          
          {/* File previews */}
          {files.length > 0 && (
            <div className="file-preview-container">
              {files.map((file, idx) => (
                <div key={idx} className="file-chip">
                  <span className="file-name">{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="file-remove-btn">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Chat box container */}
          <div 
            className="chat-box"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <button 
              className="action-btn attach-btn" 
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
            >
              📎
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              multiple
              hidden
              onChange={handleFileSelect}
            />

            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message AI Workspace..."
              rows={1}
            />

            <button
              type="button"
              className={`action-btn submit-btn ${prompt.trim() || files.length > 0 ? 'active' : ''}`}
              onClick={handleSubmit}
              disabled={loading || (!prompt.trim() && files.length === 0)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        <p className="footer-note">AI Workspace can make mistakes. Consider verifying important information.</p>
      </div>
    </div>
  );
}

export default App;