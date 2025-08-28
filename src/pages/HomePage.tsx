import React from 'react';
import { Page } from '../App';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="page">
      <div className="container">
        <h1 className="title">🎯 AI Bubble Shooter</h1>
        <p className="subtitle">
          Experience the power of A* pathfinding algorithm in action!<br/>
          Watch as AI calculates the perfect shots in this classic bubble shooter game.
        </p>
        
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">Smart AI</h3>
            <p className="feature-description">
              Advanced A* algorithm finds optimal paths through complex bubble formations
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3 className="feature-title">Classic Gameplay</h3>
            <p className="feature-description">
              Authentic bubble shooter mechanics with modern AI-powered assistance
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Algorithm Visualization</h3>
            <p className="feature-description">
              See the AI thinking process with real-time pathfinding visualization
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3 className="feature-title">Educational</h3>
            <p className="feature-description">
              Learn computer science concepts through interactive gameplay
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: '40px' }}>
          <button 
            className="button" 
            onClick={() => onNavigate('game')}
            style={{ fontSize: '18px', padding: '20px 40px' }}
          >
            🚀 Start Playing
          </button>
          <button 
            className="button secondary" 
            onClick={() => onNavigate('tutorial')}
          >
            📚 How to Play
          </button>
          <button 
            className="button outline" 
            onClick={() => onNavigate('about')}
          >
            ℹ️ About A* Algorithm
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;