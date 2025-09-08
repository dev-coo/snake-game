import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import NetworkService from '@/services/NetworkService';

interface MultiplayerMenuProps {
  onBack: () => void;
}

export default function MultiplayerMenu({ onBack }: MultiplayerMenuProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const { playerName, gameMode } = useGameStore();
  
  const networkService = NetworkService.getInstance();
  
  useEffect(() => {
    // 서버 연결
    networkService.connect().catch((err) => {
      console.error('Failed to connect to server:', err);
      setError('서버에 연결할 수 없습니다');
    });
    
    return () => {
      // 컴포넌트 언마운트 시 연결 해제는 하지 않음 (다른 곳에서 사용할 수 있으므로)
    };
  }, []);
  
  const handleCreateRoom = async () => {
    if (!playerName) {
      setError('플레이어 이름을 입력해주세요');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      console.log('Creating room...');
      await networkService.connect();
      networkService.createRoom(playerName, gameMode);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError(`서버 연결 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      setIsCreating(false);
    }
  };
  
  const handleJoinRoom = async () => {
    if (!playerName) {
      setError('플레이어 이름을 입력해주세요');
      return;
    }
    
    if (!roomCode || roomCode.length !== 6) {
      setError('올바른 방 코드를 입력해주세요');
      return;
    }
    
    setIsJoining(true);
    setError('');
    
    try {
      console.log('Joining room...');
      await networkService.connect();
      networkService.joinRoom(roomCode.toUpperCase(), playerName);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError(`서버 연결 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      setIsJoining(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8 text-snake-primary">
        멀티플레이어
      </h2>
      
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!isCreating && !isJoining ? (
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full btn-primary py-4 text-lg"
          >
            새 방 만들기
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-game-bg text-gray-400">또는</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="방 코드 입력"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
                       text-white text-center text-lg tracking-wider
                       focus:outline-none focus:ring-2 focus:ring-snake-primary"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg 
                       transition-colors"
            >
              방 참가하기
            </button>
          </div>
          
          <button
            onClick={onBack}
            className="w-full text-gray-400 hover:text-white py-2 transition-colors"
          >
            뒤로가기
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 
                        border-snake-primary mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isCreating ? '방을 생성하는 중...' : '방에 참가하는 중...'}
          </p>
        </div>
      )}
    </div>
  );
}