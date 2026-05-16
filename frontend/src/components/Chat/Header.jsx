import { BookOpen, UploadCloud } from 'lucide-react';
import './Header.css';

function Header({ fileName, onNewUpload }) {
  return (
    <header className="chat-header glass-heavy" id="chat-header">
      <div className="chat-header-left">
        <div className="chat-header-logo">
          <BookOpen size={20} strokeWidth={2.5} />
        </div>
        <div className="chat-header-info">
          <h2 className="chat-header-title">Vidya AI</h2>
          <span className="chat-header-file" title={fileName}>
            {fileName}
          </span>
        </div>
      </div>

      <button
        className="chat-header-upload"
        onClick={onNewUpload}
        id="new-upload-btn"
        title="Upload a different PDF"
      >
        <UploadCloud size={16} />
        <span>New PDF</span>
      </button>
    </header>
  );
}

export default Header;
