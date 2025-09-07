import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

/**
 * 메인 메뉴 컴포넌트
 * 게임 시작 화면 UI
 */
export default function MainMenu() {
  const [playerName, setPlayerName] = useState('');
  const { setGameStatus, setGameMode, setPlayerName: setStorePlayerName } = useGameStore();

  // 컴포넌트 마운트 시 저장된 이름 불러오기
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
      setStorePlayerName(savedName);
    }
  }, [setStorePlayerName]);

  const handleSinglePlayer = () => {
    if (!playerName.trim()) {
      alert('플레이어 이름을 입력해주세요!');
      return;
    }

    // 이름을 localStorage에 저장
    localStorage.setItem('playerName', playerName);
    setStorePlayerName(playerName);
    setGameMode('classic');
    setGameStatus('playing');
  };

  const handleMultiPlayer = () => {
    if (!playerName.trim()) {
      alert('플레이어 이름을 입력해주세요!');
      return;
    }

    // 이름을 localStorage에 저장
    localStorage.setItem('playerName', playerName);
    setStorePlayerName(playerName);
    setGameMode('battle');
    // TODO: 멀티플레이어 구현 시 로비로 이동
    alert('멀티플레이어는 준비중입니다!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-game-bg">
      <div className="max-w-md w-full mx-4">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-snake-primary mb-2">
            Snake Battle
          </h1>
          <p className="text-gray-400 text-lg">
            1:1 온라인 스네이크 게임
          </p>
        </div>

        {/* 플레이어 이름 입력 */}
        <div className="mb-6">
          <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
            플레이어 이름
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-snake-primary transition-colors"
            maxLength={20}
          />
        </div>

        {/* 게임 모드 선택 */}
        <div className="space-y-3">
          <button
            onClick={handleSinglePlayer}
            className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <span className="text-2xl">🎮</span>
            <span>싱글 플레이</span>
          </button>

          <button
            onClick={handleMultiPlayer}
            className="w-full btn-secondary text-lg py-4 flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <span className="text-2xl">⚔️</span>
            <span>멀티 플레이</span>
          </button>
        </div>

        {/* 조작법 안내 */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">조작법</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• WASD 또는 방향키로 이동</p>
            <p>• 먹이를 먹으면 점수와 길이 증가</p>
            <p>• 벽이나 자신의 몸에 부딪히면 게임 오버</p>
          </div>
        </div>

        {/* 설정 버튼 */}
        <div className="mt-6 text-center">
          <button className="text-gray-400 hover:text-white text-sm transition-colors">
            ⚙️ 설정
          </button>
        </div>
      </div>
    </div>
  );
}