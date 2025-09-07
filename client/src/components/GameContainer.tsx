import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { phaserConfig } from '@/game/config/GameConfig';
import { useGameStore } from '@/store/gameStore';
import GameUI from './GameUI';
import GameOverModal from './GameOverModal';

/**
 * 게임 컨테이너 컴포넌트
 * Phaser 게임 인스턴스를 관리하고 UI를 표시
 */
export default function GameContainer() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { gameStatus, resetGame } = useGameStore();

  useEffect(() => {
    // Phaser 게임 인스턴스 생성
    if (gameContainerRef.current && !gameRef.current) {
      const config = {
        ...phaserConfig,
        parent: gameContainerRef.current,
      };
      
      gameRef.current = new Phaser.Game(config);
    }

    // 클린업
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const handleBackToMenu = () => {
    resetGame();
  };

  const handleRestart = () => {
    if (gameRef.current) {
      // 현재 씬 재시작
      const scene = gameRef.current.scene.getScene('GameScene');
      if (scene) {
        scene.scene.restart();
      }
    }
    useGameStore.getState().setGameStatus('playing');
  };

  return (
    <div className="min-h-screen bg-game-bg flex flex-col">
      {/* 헤더 */}
      <div className="flex-none">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto w-full">
          <button
            onClick={handleBackToMenu}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← 메뉴로
          </button>
          <h2 className="text-xl font-bold text-snake-primary">
            Snake Battle
          </h2>
          <div className="w-20" /> {/* 균형을 위한 빈 공간 */}
        </div>
      </div>

      {/* 게임 영역 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          {/* Phaser 게임 캔버스 */}
          <div 
            ref={gameContainerRef}
            id="game-container"
            className="rounded-lg overflow-hidden shadow-2xl"
          />
        </div>
      </div>
      
      {/* 게임 UI 오버레이 - 게임 캔버스 밖에 위치 */}
      {gameStatus === 'playing' && <GameUI />}

      {/* 게임 오버 모달 */}
      {gameStatus === 'finished' && (
        <GameOverModal 
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}