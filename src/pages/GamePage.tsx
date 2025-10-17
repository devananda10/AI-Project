import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Page } from '../App';
import { BubbleShooterEngine } from '../game/BubbleShooterEngine';

interface GamePageProps {
  onNavigate: (page: Page) => void;
}

const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<BubbleShooterEngine | null>(null);
  
  const [gameStats, setGameStats] = useState({
    score: 0,
    level: 1,
    bubblesLeft: 0,
    shots: 0,
    astarCalculations: 0,
    pathLength: 0,
    accuracy: 100
  });
  
  const [gameState, setGameState] = useState({
    isPaused: false,
    gameOver: false,
    showAI: true,
    aiMode: false,
    showPath: true
  });

  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameEngineRef.current = new BubbleShooterEngine(canvas, {
      onStatsUpdate: setGameStats,
      onGameStateChange: setGameState
    });
  }, []);

  useEffect(() => {
    initializeGame();
    
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, [initializeGame]);

  const handleShoot = () => {
    gameEngineRef.current?.shoot();
  };

  const toggleAI = () => {
    const newAIMode = !gameState.aiMode;
    setGameState(prev => ({ ...prev, aiMode: newAIMode }));
    gameEngineRef.current?.toggleAI(newAIMode);
  };

  const togglePath = () => {
    const newShowPath = !gameState.showPath;
    setGameState(prev => ({ ...prev, showPath: newShowPath }));
    gameEngineRef.current?.togglePathVisibility(newShowPath);
  };

  const pauseGame = () => {
    const newPaused = !gameState.isPaused;
    setGameState(prev => ({ ...prev, isPaused: newPaused }));
    gameEngineRef.current?.togglePause(newPaused);
  };

  const resetGame = () => {
    gameEngineRef.current?.resetGame();
  };

  const nextLevel = () => {
    gameEngineRef.current?.nextLevel();
  };

  return (
    <div className="page" style={{ justifyContent: 'flex-start', paddingTop: '20px' }}>
      <button className="nav-button" onClick={() => onNavigate('home')}>
        ← Back to Home
      </button>
      
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start' }}>
          
          {/* Game Canvas */}
          <div style={{ position: 'relative' }}>
            <div style={{ 
              background: 'linear-gradient(180deg, #001122 0%, #003366 100%)',
              borderRadius: '15px',
              padding: '10px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{
                  display: 'block',
                  borderRadius: '10px',
                  cursor: 'crosshair'
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  gameEngineRef.current?.handleClick(x, y);
                }}
              />
            </div>
            
            {/* Game Over Overlay */}
            {gameState.gameOver && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '15px',
                color: 'white',
                textAlign: 'center'
              }}>
                <h2 style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉 Level Complete!</h2>
                <p style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
                  Score: {gameStats.score.toLocaleString()}
                </p>
                <div>
                  <button className="button" onClick={nextLevel}>
                    Next Level
                  </button>
                  <button className="button secondary" onClick={resetGame}>
                    Restart
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Game Controls & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Score Panel */}
            <div style={{
              background: 'rgba(240, 240, 240, 0.9)',
              padding: '20px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>🏆 Game Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div><strong>Score:</strong> {gameStats.score.toLocaleString()}</div>
                <div><strong>Level:</strong> {gameStats.level}</div>
                <div><strong>Bubbles Left:</strong> {gameStats.bubblesLeft}</div>
                <div><strong>Shots:</strong> {gameStats.shots}</div>
                <div><strong>Accuracy:</strong> {gameStats.accuracy}%</div>
                <div><strong>A* Calcs:</strong> {gameStats.astarCalculations}</div>
              </div>
            </div>

            {/* Game Controls */}
            <div style={{
              background: 'rgba(240, 240, 240, 0.9)',
              padding: '20px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>🎮 Controls</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="button" onClick={handleShoot}>
                  🎯 Shoot Bubble
                </button>
                <button 
                  className={`button ${gameState.aiMode ? 'danger' : 'secondary'}`}
                  onClick={toggleAI}
                >
                  {gameState.aiMode ? '🤖 AI: ON' : '🧠 AI: OFF'}
                </button>
                <button 
                  className="button secondary"
                  onClick={togglePath}
                >
                  {gameState.showPath ? '👁️‍🗨️ Hide Path' : '👁️ Show Path'}
                </button>
                <button 
                  className="button outline"
                  onClick={pauseGame}
                >
                  {gameState.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
              </div>
            </div>

            {/* AI Information */}
            <div style={{
              background: 'rgba(240, 240, 240, 0.9)',
              padding: '20px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>🤖 AI Status</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>Algorithm:</strong> A* Pathfinding</p>
                <p><strong>Path Length:</strong> {gameStats.pathLength} nodes</p>
                <p><strong>Status:</strong> {gameState.aiMode ? '🟢 Active' : '🔴 Manual'}</p>
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
                  <small>
                    The A* algorithm calculates optimal bubble trajectories by considering 
                    bubble colors, cluster formations, and potential chain reactions.
                  </small>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{
              background: 'rgba(240, 240, 240, 0.9)',
              padding: '20px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>🎨 Legend</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ff6b6b' }}></div>
                  <span>Current Bubble</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#4ecdc4' }}></div>
                  <span>Target Area</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#96ceb4' }}></div>
                  <span>AI Path (Bright Green)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#feca57' }}></div>
                  <span>Special Bubble</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'rgba(240, 240, 240, 0.9)',
              padding: '20px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>⚡ Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="button outline" onClick={resetGame} style={{ padding: '8px 16px', fontSize: '14px' }}>
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
