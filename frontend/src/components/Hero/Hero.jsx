import { BookOpen, Sparkles } from 'lucide-react';
import './Hero.css';

function Hero() {
  return (
    <section className="hero" id="hero-section">
      <div className="hero-badge">
        <Sparkles size={14} />
        <span>AI-Powered Learning</span>
      </div>

      <h1 className="hero-title">
        <span className="hero-title-icon">
          <BookOpen size={40} strokeWidth={2.5} />
        </span>
        Vidya AI
      </h1>

      <p className="hero-subtitle">
      Ask anything from your NCERT textbook. Get clear answers, instantly.
      </p>

      <div className="hero-features">
        <div className="hero-feature">
          <div className="hero-feature-dot" />
          <span>NCERT Focused</span>
        </div>
        <div className="hero-feature">
          <div className="hero-feature-dot" />
          <span>Instant Answers</span>
        </div>
        <div className="hero-feature">
          <div className="hero-feature-dot" />
          <span>Works Offline</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
