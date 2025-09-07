import { useState } from 'react';
import GameContainer from './components/GameContainer';
import MainMenu from './components/MainMenu';
import { useGameStore } from './store/gameStore';

function App() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  
  return (
    <div className="min-h-screen bg-game-bg">
      {gameStatus === 'menu' ? (
        <MainMenu />
      ) : (
        <GameContainer />
      )}
    </div>
  );
}

export default App;