import { Bot } from 'lucide-react';
import './TypingIndicator.css';

function TypingIndicator() {
  return (
    <div className="message message--ai typing-wrapper">
      <div className="message-avatar message-avatar--ai">
        <Bot size={16} />
      </div>
      <div className="typing-bubble">
        <div className="typing-dots">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
