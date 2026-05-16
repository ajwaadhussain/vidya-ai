import { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../../api';
import Header from './Header';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import './ChatInterface.css';

const LOADING_MESSAGES = [
  "Reading your textbook...",
  "Finding relevant sections...",
  "Generating answer..."
];

function ChatInterface({ sessionId, fileName, onNewUpload }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 2 ? prev + 1 : 2));
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSend = async (question) => {
    if (!question.trim() || isLoading) return;

    const userMessage = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const data = await askQuestion(sessionId, question.trim());
      const aiMessage = { role: 'ai', content: data.answer, source: data.source };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        role: 'ai',
        content: `⚠️ **Something went wrong.**\n\n${err.message || 'The AI is temporarily unavailable. Please try again in a moment.'}`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface" id="chat-interface">
      <Header fileName={fileName} onNewUpload={onNewUpload} />

      <div className="chat-messages" ref={messageListRef} id="message-list">
        {messages.length === 0 && !isLoading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💡</div>
            <h3>Start a Conversation</h3>
            <p>
              Your textbook <strong>{fileName}</strong> is ready.
              Ask any question about it!
            </p>
            <div className="chat-empty-suggestions">
              <button className="chat-suggestion" onClick={() => handleSend('Summarize this chapter for me')}>
                Summarize this chapter
              </button>
              <button className="chat-suggestion" onClick={() => handleSend('What are the key concepts?')}>
                Key concepts
              </button>
              <button className="chat-suggestion" onClick={() => handleSend('Explain the main topics covered')}>
                Main topics
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {isLoading && (
          <div className="typing-indicator">
            {LOADING_MESSAGES[loadingStep]}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

export default ChatInterface;