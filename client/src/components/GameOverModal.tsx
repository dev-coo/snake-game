import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import NetworkService from '@/services/NetworkService';

interface GameOverModalProps {
  onRestart: () => void;
  onBackToMenu: () => void;
}

/**
 * 게임 오버 모달 컴포넌트
 * 게임 종료 시 결과를 표시하고 다음 행동 선택
 */
export default function GameOverModal({ onRestart, onBackToMenu }: GameOverModalProps) {
  const { playerName, gameMode, gameOverReason, roomId } = useGameStore();
  const [isWaitingForRematch, setIsWaitingForRematch] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  
  const isMultiplayer = roomId !== null;
  const networkService = NetworkService.getInstance();
  
  useEffect(() => {
    if (!isMultiplayer) return;
    
    const socket = (networkService as any).socket;
    if (!socket) return;
    
    // 재경기 요청 받음
    const handleRematchRequested = (data: any) => {
      setOpponentWantsRematch(true);
    };
    
    // 재경기 취소됨
    const handleRematchCancelled = (data: any) => {
      setOpponentWantsRematch(false);
    };
    
    // 재경기 시작
    const handleRematchStarting = () => {
      // 게임 씬으로 돌아가기
      const store = useGameStore.getState();
      store.setGameStatus('playing');
      store.setGameOverReason(null);
    };
    
    socket.on('rematch-requested', handleRematchRequested);
    socket.on('rematch-cancelled', handleRematchCancelled);
    socket.on('rematch-starting', handleRematchStarting);
    
    return () => {
      socket.off('rematch-requested', handleRematchRequested);
      socket.off('rematch-cancelled', handleRematchCancelled);
      socket.off('rematch-starting', handleRematchStarting);
    };
  }, [isMultiplayer]);
  
  const handleRematch = () => {
    if (!roomId) return;
    
    if (rematchRequested) {
      // 취소
      networkService.cancelRematch(roomId);
      setRematchRequested(false);
    } else {
      // 요청
      networkService.requestRematch(roomId);
      setRematchRequested(true);
    }
  };
  
  // TODO: 실제 게임 결과 데이터 연동
  const gameResult = {
    score: 0,
    timeElapsed: 0,
    foodEaten: 0,
    maxLength: 3,
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4 animate-fade-in">
        {/* 타이틀 */}
        <h2 className="text-3xl font-bold text-center mb-2 text-red-400">
          Game Over
        </h2>
        <p className="text-center text-gray-400 mb-6">
          {gameOverReason || '알 수 없는 이유'}에 충돌했습니다
        </p>

        {/* 결과 정보 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">플레이어</span>
            <span className="text-white font-semibold">{playerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">모드</span>
            <span className="text-white">{gameMode === 'classic' ? '클래식' : '배틀'}</span>
          </div>
          <div className="h-px bg-gray-700"></div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">최종 점수</span>
            <span className="text-2xl font-bold text-snake-primary">{gameResult.score}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">먹은 먹이</span>
            <span className="text-white">{gameResult.foodEaten}개</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">최대 길이</span>
            <span className="text-white">{gameResult.maxLength}</span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          {isMultiplayer ? (
            <>
              <button
                onClick={handleRematch}
                className={`w-full py-3 text-lg flex items-center justify-center gap-2 rounded-lg transition-colors ${
                  rematchRequested 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'btn-primary'
                }`}
              >
                <span>🔄</span>
                <span>{rematchRequested ? '재경기 요청 취소' : '재경기 요청'}</span>
              </button>
              
              {(rematchRequested || opponentWantsRematch) && (
                <div className="text-center text-sm">
                  {rematchRequested && opponentWantsRematch ? (
                    <span className="text-green-400">잠시 후 재경기가 시작됩니다!</span>
                  ) : rematchRequested ? (
                    <span className="text-yellow-400">상대방의 응답을 기다리는 중...</span>
                  ) : (
                    <span className="text-yellow-400">상대방이 재경기를 원합니다!</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onRestart}
              className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>다시 시작</span>
            </button>
          )}
          
          <button
            onClick={onBackToMenu}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
          >
            메인 메뉴로
          </button>
        </div>

        {/* 팁 */}
        <div className="mt-6 text-center text-xs text-gray-500">
          💡 팁: 꼬리를 조심하며 코너를 활용하세요!
        </div>
      </div>
    </div>
  );
}