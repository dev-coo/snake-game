import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import NetworkService from '@/services/NetworkService';

interface Player {
  id: string;
  name: string;
  ready: boolean;
  isHost: boolean;
}

interface WaitingRoomProps {
  onLeave: () => void;
}

export default function WaitingRoom({ onLeave }: WaitingRoomProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const { roomId, playerName, gameMode } = useGameStore();
  
  const networkService = NetworkService.getInstance();
  
  useEffect(() => {
    if (!roomId) return;
    
    const handleRoomUpdate = (data: { players: Player[]; status: string }) => {
      setPlayers(data.players);
    };
    
    networkService.onRoomUpdate(handleRoomUpdate);
    
    return () => {
      networkService.offRoomUpdate();
    };
  }, [roomId]);
  
  const handleReady = () => {
    if (!roomId) return;
    
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    networkService.setReady(roomId, newReadyState);
  };
  
  const handleLeave = () => {
    if (roomId) {
      networkService.leaveRoom(roomId);
    }
    onLeave();
  };
  
  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      // TODO: 복사 완료 알림
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-900 rounded-xl p-8">
        {/* 방 정보 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">대기실</h2>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-gray-400">방 코드:</div>
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-2xl font-mono text-snake-primary tracking-wider">
                {roomId}
              </span>
              <button
                onClick={copyRoomCode}
                className="text-gray-400 hover:text-white transition-colors"
              >
                📋
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            게임 모드: {gameMode === 'classic' ? '클래식' : '배틀'}
          </div>
        </div>
        
        {/* 플레이어 목록 */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold mb-2">
            플레이어 ({players.length}/2)
          </h3>
          
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-gray-800 p-4 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  player.ready ? 'bg-green-500' : 'bg-gray-500'
                }`} />
                <span className="text-lg">{player.name}</span>
                {player.isHost && (
                  <span className="text-xs bg-snake-primary/20 text-snake-primary 
                                 px-2 py-1 rounded">호스트</span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {player.ready ? '준비 완료' : '대기 중'}
              </div>
            </div>
          ))}
          
          {players.length < 2 && (
            <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">
              다른 플레이어를 기다리는 중...
            </div>
          )}
        </div>
        
        {/* 액션 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={handleReady}
            disabled={players.length < 2}
            className={`flex-1 py-3 rounded-lg transition-colors ${
              players.length < 2
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : isReady
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'btn-primary'
            }`}
          >
            {isReady ? '준비 취소' : '준비 완료'}
          </button>
          
          <button
            onClick={handleLeave}
            className="px-6 bg-red-900/50 hover:bg-red-900/70 text-red-200 
                     rounded-lg transition-colors"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}