import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Hero from './components/Hero/Hero';
import Dropzone from './components/Dropzone/Dropzone';
import ChatInterface from './components/Chat/ChatInterface';
import './App.css';

function App() {
  const [sessionId] = useState(() => {
    let sid = sessionStorage.getItem('vidya_session_id');
    if (!sid) {
      sid = uuidv4();
      sessionStorage.setItem('vidya_session_id', sid);
    }
    return sid;
  });
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleUploadSuccess = (fileName) => {
    setUploadedFileName(fileName);
    setIsTransitioning(true);
    setTimeout(() => {
      setIsUploaded(true);
      setIsTransitioning(false);
    }, 400);
  };

  const handleNewUpload = () => {
    const newSid = uuidv4();
    sessionStorage.setItem('vidya_session_id', newSid);
    window.location.reload();
  };

  return (
    <div className="app">
      {!isUploaded ? (
        <div className={`landing-screen ${isTransitioning ? 'screen-exit' : 'screen-enter'}`}>
          <Hero />
          <Dropzone sessionId={sessionId} onUploadSuccess={handleUploadSuccess} />
        </div>
      ) : (
        <div className={`chat-screen ${isTransitioning ? 'screen-exit' : 'screen-enter'}`}>
          <ChatInterface
            sessionId={sessionId}
            fileName={uploadedFileName}
            onNewUpload={handleNewUpload}
          />
        </div>
      )}
    </div>
  );
}

export default App;