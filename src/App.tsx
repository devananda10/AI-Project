import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import TutorialPage from './pages/TutorialPage';
import AboutPage from './pages/AboutPage';
import './App.css';

export type Page = 'home' | 'game' | 'tutorial' | 'about';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'game':
        return <GamePage onNavigate={setCurrentPage} />;
      case 'tutorial':
        return <TutorialPage onNavigate={setCurrentPage} />;
      case 'about':
        return <AboutPage onNavigate={setCurrentPage} />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;