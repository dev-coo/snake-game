import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GAME_CONFIG } from '@snake-game/shared';

/**
 * 게임 UI 컴포넌트
 * 점수, 시간, 상태 등을 표시
 */
export default function GameUI() {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const { gameMode, playerName } = useGameStore();

  useEffect(() => {
    // 타이머 시작
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 시간 포맷팅 (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 남은 시간 계산
  const timeLimit = gameMode === 'classic' 
    ? GAME_CONFIG.TIME_LIMIT.CLASSIC 
    : GAME_CONFIG.TIME_LIMIT.BATTLE;
  const timeRemaining = Math.max(0, timeLimit - timeElapsed);

  return (
    <div className="fixed top-20 left-0 right-0 p-4 pointer-events-none z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-start gap-4">
        {/* 왼쪽: 플레이어 정보 */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 min-w-[150px]">
          <div className="text-xs text-gray-400 mb-1">플레이어</div>
          <div className="font-semibold text-white">{playerName || '플레이어 1'}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-4 h-4 bg-snake-primary rounded"></div>
            <span className="text-sm text-gray-300">점수: {score}</span>
          </div>
        </div>

        {/* 중앙: 시간 */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">남은 시간</div>
          <div className={`font-bold text-2xl ${timeRemaining <= 30 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* 오른쪽: 게임 정보 */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 min-w-[150px]">
          <div className="text-xs text-gray-400 mb-1">모드</div>
          <div className="font-semibold text-white">
            {gameMode === 'classic' ? '클래식' : '배틀'}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            경과: {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* 하단: 조작 안내 (처음 10초만 표시) */}
      {timeElapsed < 10 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-gray-300 animate-pulse">
            WASD 또는 방향키로 이동
          </div>
        </div>
      )}
    </div>
  );
}