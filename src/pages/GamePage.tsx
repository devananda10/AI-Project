import React, a { useRef, useEffect, useState, useCallback } from 'react';
import { Page } from '../App';
import { BubbleShooterEngine, GameStats, GameState, GameStatus } from '../game/BubbleShooterEngine';

interface GamePageProps {
  onNavigate: (page: Page) => void;
}

const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<BubbleShooterEngine | null>(null);
  
  // State for stats from the game engine
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    level: 1,
    shots: 0,
    shotsUntilDrop: 5,
  });
  
  // State for the overall game status (playing, gameOver, etc.)
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');

  // Local UI state for controlling game options
  const [aiMode, setAiMode] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Callback for the engine to update the game status
  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameStatus(newState.status);
  }, []);

  // Initialize the game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const engine = new BubbleShooterEngine(canvas, {
        onStatsUpdate: setGameStats,
        onGameStateChange: handleGameStateChange,
      });
      gameEngineRef.current = engine;
      // Set initial state from engine to UI controls
      engine.toggleAI(aiMode);
    }
    
    return () => {
      gameEngineRef.current?.destroy();
    };
  }, [handleGameStateChange, aiMode]);

  // --- Control Handlers ---

  const handleShoot = () => {
    if (!aiMode) {
      gameEngineRef.current?.shoot();
    }
  };

  const toggleAI = () => {
    const newAiMode = !aiMode;
    setAiMode(newAiMode);
    gameEngineRef.current?.toggleAI(newAiMode);
  };

  const togglePath = () => {
    // This is now a visual toggle only, no need to inform the engine
    setShowPath(prev => !prev);
  };
  
  const handleReset = () => {
    gameEngineRef.current?.resetGame();
  };

  const handleNextLevel = () => {
    gameEngineRef.current?.nextLevel();
  };

  // --- Render Logic ---

  const renderOverlay = () => {
    if (gameStatus === 'playing') return null;

    const isGameOver = gameStatus === 'gameOver';
    const title = isGameOver ? 'Game Over' : 'Level Complete!';
    const icon = isGameOver ? '💀' : '🎉';

    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', borderRadius: '15px',
        color: 'white', textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '20px' }}>{icon} {title}</h2>
        <p style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
          Final Score: {gameStats.score.toLocaleString()}
        </p>
        <div>
          {!isGameOver && (
            <button className="button" onClick={handleNextLevel}>
              Next Level
            </button>
          )}
          <button className="button secondary" onClick={handleReset}>
            Play Again
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page" style={{ justifyContent: 'flex-start', paddingTop: '20px' }}>
      <button className="nav-button" onClick={() => onNavigate('home')}>
        ← Back to Home
      </button>
      
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start' }}>
          
          <div style={{ position: 'relative' }}>
            <div style={{ background: '#000', borderRadius: '15px', padding: '10px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ display: 'block', borderRadius: '10px', cursor: 'crosshair' }}
              />
            </div>
            {renderOverlay()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="feature-card">
              <h3 className="feature-title">🏆 Game Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div><strong>Score:</strong> {gameStats.score.toLocaleString()}</div>
                <div><strong>Level:</strong> {gameStats.level}</div>
                <div><strong>Shots:</strong> {gameStats.shots}</div>
                <div><strong>Next Drop:</strong> {gameStats.shotsUntilDrop}</div>
              </div>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">🎮 Controls</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="button" onClick={handleShoot} disabled={aiMode}>
                  🎯 Shoot (Manual)
                </button>
                <button 
                  className={`button ${aiMode ? 'danger' : 'secondary'}`}
                  onClick={toggleAI}
                >
                  {aiMode ? '🤖 AI: ON' : '🧠 AI: OFF'}
                </button>
                <button 
                  className="button secondary"
                  onClick={togglePath}
                >
                  {showPath ? '👁️ Hide Path' : '🔍 Show Path'}
                </button>
              </div>
            </div>

            <div className="feature-card">
                 <h3 className="feature-title">⚡ Quick Actions</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="button outline" onClick={handleReset} style={{ padding: '8px 16px', fontSize: '14px' }}>
                        🔄 Restart Level
                    </button>
                    <button className="button outline" onClick={() => onNavigate('tutorial')} style={{ padding: '8px 16px', fontSize: '14px' }}>
                        📚 View Tutorial
                    </button>
                 </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
