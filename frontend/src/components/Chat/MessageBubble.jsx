import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import './MessageBubble.css';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--ai'} ${message.isError ? 'message--error' : ''}`}>
      {/* Avatar */}
      <div className={`message-avatar ${isUser ? 'message-avatar--user' : 'message-avatar--ai'}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div className={`message-bubble ${isUser ? 'message-bubble--user' : 'message-bubble--ai'}`}>
        {isUser ? (
          <p className="message-text">{message.content}</p>
        ) : (
          <div className="message-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {!message.isError && (
              <span className="source-badge">📚 Answered from your textbook</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;