import Phaser from 'phaser';
import PreloadScene from '../scenes/PreloadScene';
import GameScene from '../scenes/GameScene';
import { GAME_CONFIG } from '@snake-game/shared';

/**
 * Phaser 게임 설정
 */
export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.GRID_SIZE.WIDTH * GAME_CONFIG.CELL_SIZE,
  height: GAME_CONFIG.GRID_SIZE.HEIGHT * GAME_CONFIG.CELL_SIZE,
  backgroundColor: '#0a0a0a',
  scene: [PreloadScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};