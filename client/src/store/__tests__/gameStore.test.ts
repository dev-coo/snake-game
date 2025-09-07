import { useGameStore } from '../gameStore';
import { GameState, GameMode } from '@snake-game/shared';

describe('gameStore 테스트', () => {
  // 각 테스트 전에 store를 초기 상태로 리셋
  beforeEach(() => {
    const store = useGameStore.getState();
    store.resetGame();
  });

  describe('초기 상태', () => {
    it('올바른 초기 상태를 가져야 함', () => {
      const state = useGameStore.getState();

      expect(state.gameStatus).toBe('menu');
      expect(state.gameMode).toBe('classic');
      expect(state.playerName).toBe('');
      expect(state.roomId).toBeNull();
      expect(state.gameState).toBeNull();
    });
  });

  describe('게임 상태 업데이트', () => {
    it('게임 상태를 업데이트할 수 있어야 함', () => {
      const { setGameStatus } = useGameStore.getState();

      setGameStatus('loading');
      expect(useGameStore.getState().gameStatus).toBe('loading');

      setGameStatus('playing');
      expect(useGameStore.getState().gameStatus).toBe('playing');

      setGameStatus('finished');
      expect(useGameStore.getState().gameStatus).toBe('finished');

      setGameStatus('menu');
      expect(useGameStore.getState().gameStatus).toBe('menu');
    });
  });

  describe('게임 모드 설정', () => {
    it('게임 모드를 변경할 수 있어야 함', () => {
      const { setGameMode } = useGameStore.getState();

      setGameMode('battle');
      expect(useGameStore.getState().gameMode).toBe('battle');

      setGameMode('classic');
      expect(useGameStore.getState().gameMode).toBe('classic');
    });
  });

  describe('플레이어 이름 설정', () => {
    it('플레이어 이름을 설정할 수 있어야 함', () => {
      const { setPlayerName } = useGameStore.getState();

      setPlayerName('테스트플레이어');
      expect(useGameStore.getState().playerName).toBe('테스트플레이어');

      setPlayerName('');
      expect(useGameStore.getState().playerName).toBe('');
    });
  });

  describe('룸 ID 설정', () => {
    it('룸 ID를 설정하고 제거할 수 있어야 함', () => {
      const { setRoomId } = useGameStore.getState();

      setRoomId('room-123');
      expect(useGameStore.getState().roomId).toBe('room-123');

      setRoomId(null);
      expect(useGameStore.getState().roomId).toBeNull();
    });
  });

  describe('게임 상태 객체 설정', () => {
    it('게임 상태 객체를 설정할 수 있어야 함', () => {
      const { setGameState } = useGameStore.getState();

      const mockGameState: GameState = {
        gameId: 'game-123',
        mode: 'battle',
        status: 'playing',
        players: [
          {
            id: 'player-1',
            name: '플레이어1',
            snake: {
              id: 'snake-1',
              positions: [{ x: 10, y: 10 }],
              direction: 'right',
              speed: 150,
              color: '#00ff00',
            },
            score: 10,
            isAlive: true,
            connectionStatus: 'connected',
          },
          {
            id: 'player-2',
            name: '플레이어2',
            snake: {
              id: 'snake-2',
              positions: [{ x: 20, y: 20 }],
              direction: 'left',
              speed: 150,
              color: '#ff0066',
            },
            score: 5,
            isAlive: true,
            connectionStatus: 'connected',
          },
        ],
        food: [
          {
            id: 'food-1',
            position: { x: 15, y: 15 },
            type: 'normal',
            value: 1,
          },
        ],
        timeElapsed: 30,
        timeRemaining: 270,
        winner: null,
        gridSize: {
          width: 40,
          height: 40,
        },
      };

      setGameState(mockGameState);
      const state = useGameStore.getState();

      expect(state.gameState).toEqual(mockGameState);
      expect(state.gameState?.gameId).toBe('game-123');
      expect(state.gameState?.players).toHaveLength(2);
      expect(state.gameState?.food).toHaveLength(1);
    });

    it('게임 상태를 null로 설정할 수 있어야 함', () => {
      const { setGameState } = useGameStore.getState();

      // 먼저 게임 상태를 설정
      setGameState({} as GameState);
      expect(useGameStore.getState().gameState).toBeDefined();

      // null로 설정
      setGameState(null);
      expect(useGameStore.getState().gameState).toBeNull();
    });
  });

  describe('게임 리셋', () => {
    it('resetGame이 모든 상태를 초기값으로 되돌려야 함', () => {
      const { 
        setGameStatus, 
        setGameMode, 
        setPlayerName, 
        setRoomId, 
        setGameState,
        resetGame 
      } = useGameStore.getState();

      // 상태 변경
      setGameStatus('playing');
      setGameMode('battle');
      setPlayerName('테스트유저');
      setRoomId('room-456');
      setGameState({} as GameState);

      // 리셋 전 확인
      const beforeReset = useGameStore.getState();
      expect(beforeReset.gameStatus).toBe('playing');
      expect(beforeReset.gameMode).toBe('battle');
      expect(beforeReset.playerName).toBe('테스트유저');
      expect(beforeReset.roomId).toBe('room-456');
      expect(beforeReset.gameState).toBeDefined();

      // 리셋
      resetGame();

      // 리셋 후 확인
      const afterReset = useGameStore.getState();
      expect(afterReset.gameStatus).toBe('menu');
      expect(afterReset.gameMode).toBe('classic');
      expect(afterReset.roomId).toBeNull();
      expect(afterReset.gameState).toBeNull();
      // playerName은 리셋하지 않음
      expect(afterReset.playerName).toBe('테스트유저');
    });
  });

  describe('다중 업데이트', () => {
    it('여러 상태를 연속으로 업데이트할 수 있어야 함', () => {
      const store = useGameStore.getState();

      // 연속 업데이트
      store.setGameStatus('loading');
      store.setGameMode('battle');
      store.setPlayerName('멀티테스트');
      store.setRoomId('multi-room');

      const state = useGameStore.getState();
      expect(state.gameStatus).toBe('loading');
      expect(state.gameMode).toBe('battle');
      expect(state.playerName).toBe('멀티테스트');
      expect(state.roomId).toBe('multi-room');
    });
  });

  describe('구독 및 선택적 상태 접근', () => {
    it('특정 상태만 선택적으로 구독할 수 있어야 함', () => {
      // Zustand의 선택적 구독 테스트
      let gameStatusUpdateCount = 0;
      let gameModeUpdateCount = 0;

      // gameStatus만 구독
      const unsubscribeStatus = useGameStore.subscribe(
        (state) => state.gameStatus,
        () => { gameStatusUpdateCount++; }
      );

      // gameMode만 구독
      const unsubscribeMode = useGameStore.subscribe(
        (state) => state.gameMode,
        () => { gameModeUpdateCount++; }
      );

      const store = useGameStore.getState();

      // gameStatus 변경
      store.setGameStatus('playing');
      expect(gameStatusUpdateCount).toBe(1);
      expect(gameModeUpdateCount).toBe(0);

      // gameMode 변경
      store.setGameMode('battle');
      expect(gameStatusUpdateCount).toBe(1);
      expect(gameModeUpdateCount).toBe(1);

      // 다른 상태 변경 (구독하지 않은 상태)
      store.setPlayerName('테스트');
      expect(gameStatusUpdateCount).toBe(1);
      expect(gameModeUpdateCount).toBe(1);

      // 구독 해제
      unsubscribeStatus();
      unsubscribeMode();

      // 구독 해제 후 변경
      store.setGameStatus('menu');
      store.setGameMode('classic');
      expect(gameStatusUpdateCount).toBe(1);
      expect(gameModeUpdateCount).toBe(1);
    });
  });
});