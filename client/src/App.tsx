import GameContainer from './components/GameContainer';
import MainMenu from './components/MainMenu';
import MultiplayerMenu from './components/MultiplayerMenu';
import WaitingRoom from './components/WaitingRoom';
import { useGameStore } from './store/gameStore';

function App() {
  const { gameStatus, resetGame } = useGameStore();
  
  const renderContent = () => {
    switch (gameStatus) {
      case 'menu':
        return <MainMenu />;
      
      case 'multiplayer-menu':
        return <MultiplayerMenu onBack={resetGame} />;
      
      case 'waiting-room':
        return <WaitingRoom onLeave={resetGame} />;
      
      case 'playing':
      case 'finished':
        return <GameContainer />;
      
      default:
        return <MainMenu />;
    }
  };
  
  return (
    <div className="min-h-screen bg-game-bg">
      {renderContent()}
    </div>
  );
}

export default App;