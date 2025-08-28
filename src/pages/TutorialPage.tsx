import React from 'react';
import { Page } from '../App';

interface TutorialPageProps {
  onNavigate: (page: Page) => void;
}

const TutorialPage: React.FC<TutorialPageProps> = ({ onNavigate }) => {
  return (
    <div className="page">
      <button className="nav-button" onClick={() => onNavigate('home')}>
        ← Back to Home
      </button>
      
      <div className="container">
        <h1 className="title">📚 How to Play</h1>
        <p className="subtitle">Master the art of bubble shooting with AI assistance!</p>
        
        <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">🎯 Basic Gameplay</h3>
            <div className="feature-description">
              <p><strong>Objective:</strong> Clear all bubbles from the playing field by creating groups of 3 or more bubbles of the same color.</p>
              <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                <li>Aim your bubble shooter at the bubble formation</li>
                <li>Click to shoot bubbles toward matching colors</li>
                <li>Create groups of 3+ same-colored bubbles to make them pop</li>
                <li>Clear all bubbles to advance to the next level</li>
              </ul>
            </div>
          </div>

          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">🤖 AI Assistant Features</h3>
            <div className="feature-description">
              <p><strong>A* Algorithm:</strong> Our AI uses advanced pathfinding to suggest optimal shots.</p>
              <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                <li><strong>Show Path:</strong> Green line shows the AI's recommended trajectory</li>
                <li><strong>AI Mode:</strong> Let the AI play automatically to demonstrate optimal strategies</li>
                <li><strong>Path Visualization:</strong> See how the algorithm calculates the best moves</li>
                <li><strong>Real-time Analysis:</strong> Watch the AI evaluate different shooting options</li>
              </ul>
            </div>
          </div>

          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">🎮 Controls & Interface</h3>
            <div className="feature-description">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p><strong>Mouse Controls:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    <li>Move mouse to aim</li>
                    <li>Click to shoot bubble</li>
                    <li>Right-click for precision aiming</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Keyboard Shortcuts:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    <li>Spacebar: Shoot bubble</li>
                    <li>P: Pause/Resume game</li>
                    <li>A: Toggle AI mode</li>
                    <li>H: Toggle path visibility</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">🏆 Scoring System</h3>
            <div className="feature-description">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p><strong>Points:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    <li>3 bubbles: 100 points</li>
                    <li>4 bubbles: 200 points</li>
                    <li>5+ bubbles: 300+ points</li>
                    <li>Chain reactions: Bonus multiplier</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Bonuses:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    <li>Accuracy bonus: High hit rate</li>
                    <li>Speed bonus: Quick completion</li>
                    <li>AI learning bonus: Using AI effectively</li>
                    <li>Perfect level: No missed shots</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">🧠 Understanding the A* Algorithm</h3>
            <div className="feature-description">
              <p><strong>Educational Component:</strong> Learn how AI makes decisions in real-time.</p>
              <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                <li><strong>Pathfinding:</strong> Algorithm explores possible bubble trajectories</li>
                <li><strong>Heuristic Function:</strong> Estimates the "cost" of each potential move</li>
                <li><strong>Optimization:</strong> Finds the most efficient path to create bubble groups</li>
                <li><strong>Real-time Adaptation:</strong> Recalculates strategy as the game state changes</li>
              </ul>
              <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
                <p><strong>💡 Pro Tip:</strong> Watch the AI's decision-making process by enabling path visualization. 
                Notice how it considers multiple factors: bubble colors, cluster formations, potential chain reactions, 
                and wall bounces to determine the optimal shot.</p>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <h3 className="feature-title">🎯 Advanced Strategies</h3>
            <div className="feature-description">
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Bank Shots:</strong> Use walls to reach difficult areas</li>
                <li><strong>Chain Reactions:</strong> Plan shots that create multiple groups</li>
                <li><strong>Color Management:</strong> Save specific colors for strategic moments</li>
                <li><strong>Cluster Analysis:</strong> Identify weak points in bubble formations</li>
                <li><strong>AI Learning:</strong> Observe AI strategies and apply them manually</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '40px' }}>
          <button className="button" onClick={() => onNavigate('game')}>
            🚀 Start Playing Now
          </button>
          <button className="button secondary" onClick={() => onNavigate('about')}>
            🔬 Learn About A* Algorithm
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;