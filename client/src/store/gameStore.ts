import { create } from 'zustand';
import { GameMode, GameState } from '@snake-game/shared';

interface GameResult {
  isWinner: boolean;
  scores: Record<string, number>;
  winnerName: string;
}

interface GameStore {
  gameStatus: 'menu' | 'loading' | 'playing' | 'finished' | 'multiplayer-menu' | 'waiting-room';
  gameMode: GameMode;
  playerName: string;
  roomId: string | null;
  gameState: GameState | null;
  gameOverReason: string | null;
  gameResult: GameResult | null;
  
  setGameStatus: (status: GameStore['gameStatus']) => void;
  setGameMode: (mode: GameMode) => void;
  setPlayerName: (name: string) => void;
  setRoomId: (roomId: string | null) => void;
  setGameState: (state: GameState | null) => void;
  setGameOverReason: (reason: string | null) => void;
  setGameResult: (result: GameResult | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameStatus: 'menu',
  gameMode: 'classic',
  playerName: '',
  roomId: null,
  gameState: null,
  gameOverReason: null,
  gameResult: null,

  setGameStatus: (status) => set({ gameStatus: status }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setPlayerName: (name) => set({ playerName: name }),
  setRoomId: (roomId) => set({ roomId }),
  setGameState: (state) => set({ gameState: state }),
  setGameOverReason: (reason) => set({ gameOverReason: reason }),
  setGameResult: (result) => set({ gameResult: result }),
  resetGame: () => set({
    gameStatus: 'menu',
    gameMode: 'classic',
    roomId: null,
    gameState: null,
    gameOverReason: null,
    gameResult: null,
  }),
}));