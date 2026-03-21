import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, MessageSquare, ArrowRight, Building, Users, Plus } from 'lucide-react';
import '../styles/Landing.css';

const Landing = () => {
  const [text, setText] = useState('');
  const fullText = "Discover curated, high-end residences managed with AI precision...";
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + fullText[index]);
        setIndex((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="agency-name">Apex Agencies</div>
          <div className="badge glass-card">✨ Exclusive Property Management</div>
          <h1>Elevate Your <span>Living Experience</span></h1>
          <div className="typewriter">
            <p>{text}<span className="cursor">|</span></p>
          </div>
          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">Create Account <Plus size={18} /></Link>
            <Link to="/login" className="btn-secondary">Login to Dashboard</Link>
          </div>
        </div>
        <div className="hero-image-container">
          <img 
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop" 
            alt="Luxury Modern Villa" 
            className="hero-img glass-card" 
          />
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card glass-card">
          <div className="feature-icon"><Zap size={28} /></div>
          <h3>AI-Powered Harmony</h3>
          <p>Seamless management and polite automated reminders that keep everyone in sync.</p>
        </div>
        <div className="feature-card glass-card">
          <div className="feature-icon"><MessageSquare size={28} /></div>
          <h3>Elite Community</h3>
          <p>Connect with distinguished neighbors in a secure, curated digital environment.</p>
        </div>
        <div className="feature-card glass-card">
          <div className="feature-icon"><Shield size={28} /></div>
          <h3>Concierge Security</h3>
          <p>Bank-grade encryption and privacy controls for your peace of mind.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2026 Apex Agencies. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
