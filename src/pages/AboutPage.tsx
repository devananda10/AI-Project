import React from 'react';
import { Page } from '../App';

interface AboutPageProps {
  onNavigate: (page: Page) => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="page">
      <button className="nav-button" onClick={() => onNavigate('home')}>
        ← Back to Home
      </button>
      
      <div className="container">
        <h1 className="title">🔬 About the A* Algorithm</h1>
        <p className="subtitle">Understanding the AI behind the perfect bubble shots</p>
        
        <div style={{ textAlign: 'left', maxWidth: '900px', margin: '0 auto' }}>
          
          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">🧠 What is A* (A-Star)?</h3>
            <div className="feature-description">
              <p>A* is a graph traversal and path search algorithm that finds the optimal path between nodes. 
              It's widely used in artificial intelligence, robotics, video games, and navigation systems.</p>
              
              <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>
                <p><strong>Key Formula:</strong> f(n) = g(n) + h(n)</p>
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <li><strong>f(n):</strong> Total estimated cost of path through node n</li>
                  <li><strong>g(n):</strong> Actual cost from start to node n</li>
                  <li><strong>h(n):</strong> Heuristic estimate from node n to goal</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">🎯 A* in Bubble Shooter</h3>
            <div className="feature-description">
              <p>In our bubble shooter game, A* helps the AI make optimal shooting decisions by:</p>
              <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                <li><strong>Trajectory Planning:</strong> Calculating bubble flight paths including wall bounces</li>
                <li><strong>Color Matching:</strong> Finding the best targets for creating bubble groups</li>
                <li><strong>Chain Reaction Prediction:</strong> Anticipating cascading bubble eliminations</li>
                <li><strong>Strategic Positioning:</strong> Planning shots that set up future opportunities</li>
              </ul>
              
              <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px' }}>
                <p><strong>🎮 Game-Specific Adaptations:</strong></p>
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <li>Heuristic considers bubble colors and cluster sizes</li>
                  <li>Path cost includes trajectory difficulty and bounce count</li>
                  <li>Real-time recalculation as game state changes</li>
                  <li>Multi-objective optimization for maximum points</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">⚡ Algorithm Steps</h3>
            <div className="feature-description">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p><strong>1. Initialization:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>Create open set (nodes to explore)</li>
                    <li>Create closed set (explored nodes)</li>
                    <li>Add starting position to open set</li>
                  </ul>
                  
                  <p style={{ marginTop: '15px' }}><strong>2. Main Loop:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>Select node with lowest f-score</li>
                    <li>Move to closed set</li>
                    <li>Examine neighboring nodes</li>
                  </ul>
                </div>
                <div>
                  <p><strong>3. Neighbor Evaluation:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>Calculate g, h, and f scores</li>
                    <li>Update path if better route found</li>
                    <li>Add to open set if not explored</li>
                  </ul>
                  
                  <p style={{ marginTop: '15px' }}><strong>4. Path Reconstruction:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>Trace back from goal to start</li>
                    <li>Build optimal path sequence</li>
                    <li>Execute shooting trajectory</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">📊 Performance Characteristics</h3>
            <div className="feature-description">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p><strong>Advantages:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    <li>✅ Guarantees optimal solution</li>
                    <li>✅ Efficient with good heuristics</li>
                    <li>✅ Widely applicable</li>
                    <li>✅ Well-studied and proven</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Complexity:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    <li><strong>Time:</strong> O(b^d) worst case</li>
                    <li><strong>Space:</strong> O(b^d) for storage</li>
                    <li><strong>Optimality:</strong> Yes, with admissible heuristic</li>
                    <li><strong>Completeness:</strong> Yes, if solution exists</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-card" style={{ marginBottom: '30px' }}>
            <h3 className="feature-title">🌟 Real-World Applications</h3>
            <div className="feature-description">
              <p>A* algorithm is used in many fields beyond gaming:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                <div>
                  <p><strong>🗺️ Navigation & Mapping:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>GPS navigation systems</li>
                    <li>Route planning applications</li>
                    <li>Autonomous vehicle pathfinding</li>
                  </ul>
                  
                  <p style={{ marginTop: '15px' }}><strong>🎮 Game Development:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>NPC movement and AI</li>
                    <li>Strategy game planning</li>
                    <li>Puzzle solving algorithms</li>
                  </ul>
                </div>
                <div>
                  <p><strong>🤖 Robotics:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>Robot motion planning</li>
                    <li>Obstacle avoidance</li>
                    <li>Autonomous exploration</li>
                  </ul>
                  
                  <p style={{ marginTop: '15px' }}><strong>💼 Business Applications:</strong></p>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>Supply chain optimization</li>
                    <li>Network routing protocols</li>
                    <li>Resource allocation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <h3 className="feature-title">🎓 Educational Value</h3>
            <div className="feature-description">
              <p>This bubble shooter game demonstrates key computer science concepts:</p>
              <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                <li><strong>Graph Theory:</strong> Understanding nodes, edges, and traversal</li>
                <li><strong>Heuristic Functions:</strong> Designing effective estimation methods</li>
                <li><strong>Algorithm Optimization:</strong> Balancing accuracy and performance</li>
                <li><strong>Real-time Systems:</strong> Making decisions under time constraints</li>
                <li><strong>Game AI:</strong> Applying algorithms to interactive entertainment</li>
              </ul>
              
              <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px' }}>
                <p><strong>🎯 Learning Objectives:</strong> By playing this game and observing the AI, 
                students can visualize how pathfinding algorithms work, understand the importance of 
                heuristic design, and see practical applications of theoretical computer science concepts.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '40px' }}>
          <button className="button" onClick={() => onNavigate('game')}>
            🎮 See A* in Action
          </button>
          <button className="button secondary" onClick={() => onNavigate('tutorial')}>
            📚 Learn How to Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;