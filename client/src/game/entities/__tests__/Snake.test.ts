import Snake from '../Snake';
import { Snake as SnakeType, Direction, Position } from '@snake-game/shared';
import { GAME_CONFIG } from '@snake-game/shared';

describe('Snake 클래스 테스트', () => {
  let mockScene: any;
  let snakeData: SnakeType;

  beforeEach(() => {
    // Mock Phaser Scene
    mockScene = {
      add: {
        graphics: jest.fn(() => ({
          clear: jest.fn(),
          fillStyle: jest.fn(),
          fillRect: jest.fn(),
          destroy: jest.fn(),
        })),
      },
    };

    // 기본 뱀 데이터
    snakeData = {
      id: 'test-snake-1',
      positions: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ],
      direction: 'right' as Direction,
      speed: 150,
      color: '#00ff00',
    };
  });

  describe('초기화', () => {
    it('Snake 인스턴스를 올바르게 생성해야 함', () => {
      const snake = new Snake(mockScene, snakeData);

      expect(snake).toBeDefined();
      expect(snake.getId()).toBe('test-snake-1');
      expect(snake.getDirection()).toBe('right');
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('로컬 플레이어와 원격 플레이어를 구분해야 함', () => {
      const localSnake = new Snake(mockScene, snakeData, true);
      const remoteSnake = new Snake(mockScene, snakeData, false);

      expect(localSnake).toBeDefined();
      expect(remoteSnake).toBeDefined();
    });
  });

  describe('이동 로직', () => {
    it('현재 방향으로 한 칸 이동해야 함', () => {
      const snake = new Snake(mockScene, snakeData);
      const initialHead = snake.getHead();

      snake.move();
      const newHead = snake.getHead();

      expect(newHead.x).toBe(initialHead.x + 1);
      expect(newHead.y).toBe(initialHead.y);
      expect(snake.getPositions().length).toBe(3); // 길이 유지
    });

    it('각 방향으로 올바르게 이동해야 함', () => {
      const testCases: Array<{direction: Direction, expectedDelta: Position}> = [
        { direction: 'up', expectedDelta: { x: 0, y: -1 } },
        { direction: 'down', expectedDelta: { x: 0, y: 1 } },
        { direction: 'left', expectedDelta: { x: -1, y: 0 } },
        { direction: 'right', expectedDelta: { x: 1, y: 0 } },
      ];

      testCases.forEach(({ direction, expectedDelta }) => {
        const testSnakeData = { ...snakeData, direction };
        const snake = new Snake(mockScene, testSnakeData);
        const initialHead = snake.getHead();

        snake.move();
        const newHead = snake.getHead();

        expect(newHead.x).toBe(initialHead.x + expectedDelta.x);
        expect(newHead.y).toBe(initialHead.y + expectedDelta.y);
      });
    });
  });

  describe('방향 변경', () => {
    it('유효한 방향으로 변경되어야 함', () => {
      const snake = new Snake(mockScene, snakeData); // 초기 방향: right

      snake.changeDirection('up');
      expect(snake.getDirection()).toBe('up');

      snake.changeDirection('left');
      expect(snake.getDirection()).toBe('left');
    });

    it('180도 회전을 방지해야 함', () => {
      const snake = new Snake(mockScene, snakeData); // 초기 방향: right

      snake.changeDirection('left'); // 반대 방향
      expect(snake.getDirection()).toBe('right'); // 변경되지 않음

      snake.changeDirection('up'); // 유효한 방향
      expect(snake.getDirection()).toBe('up');

      snake.changeDirection('down'); // 반대 방향
      expect(snake.getDirection()).toBe('up'); // 변경되지 않음
    });
  });

  describe('충돌 감지', () => {
    it('벽과의 충돌을 감지해야 함', () => {
      // 왼쪽 벽
      const leftWallSnake = new Snake(mockScene, {
        ...snakeData,
        positions: [{ x: -1, y: 10 }],
      });
      expect(leftWallSnake.checkWallCollision()).toBe(true);

      // 오른쪽 벽
      const rightWallSnake = new Snake(mockScene, {
        ...snakeData,
        positions: [{ x: GAME_CONFIG.GRID_SIZE.WIDTH, y: 10 }],
      });
      expect(rightWallSnake.checkWallCollision()).toBe(true);

      // 위쪽 벽
      const topWallSnake = new Snake(mockScene, {
        ...snakeData,
        positions: [{ x: 10, y: -1 }],
      });
      expect(topWallSnake.checkWallCollision()).toBe(true);

      // 아래쪽 벽
      const bottomWallSnake = new Snake(mockScene, {
        ...snakeData,
        positions: [{ x: 10, y: GAME_CONFIG.GRID_SIZE.HEIGHT }],
      });
      expect(bottomWallSnake.checkWallCollision()).toBe(true);

      // 정상 위치
      const normalSnake = new Snake(mockScene, snakeData);
      expect(normalSnake.checkWallCollision()).toBe(false);
    });

    it('자기 몸과의 충돌을 감지해야 함', () => {
      // 자기 몸에 충돌하는 경우
      const selfCollisionSnake = new Snake(mockScene, {
        ...snakeData,
        positions: [
          { x: 10, y: 10 },
          { x: 11, y: 10 },
          { x: 11, y: 11 },
          { x: 10, y: 11 },
          { x: 10, y: 10 }, // 머리가 몸통과 같은 위치
        ],
      });
      expect(selfCollisionSnake.checkSelfCollision()).toBe(true);

      // 정상적인 경우
      const normalSnake = new Snake(mockScene, snakeData);
      expect(normalSnake.checkSelfCollision()).toBe(false);
    });

    it('다른 뱀과의 충돌을 감지해야 함', () => {
      const snake1 = new Snake(mockScene, snakeData);
      const snake2Data = {
        ...snakeData,
        id: 'test-snake-2',
        positions: [
          { x: 10, y: 10 }, // snake1의 머리와 같은 위치
          { x: 10, y: 11 },
        ],
      };
      const snake2 = new Snake(mockScene, snake2Data);

      expect(snake1.checkCollisionWithSnake(snake2)).toBe(true);

      // 충돌하지 않는 경우
      const snake3Data = {
        ...snakeData,
        id: 'test-snake-3',
        positions: [
          { x: 20, y: 20 },
          { x: 20, y: 21 },
        ],
      };
      const snake3 = new Snake(mockScene, snake3Data);

      expect(snake1.checkCollisionWithSnake(snake3)).toBe(false);
    });
  });

  describe('성장', () => {
    it('grow() 호출 시 길이가 증가해야 함', () => {
      const snake = new Snake(mockScene, snakeData);
      const initialLength = snake.getPositions().length;

      snake.grow();

      expect(snake.getPositions().length).toBe(initialLength + 1);
      
      // 꼬리가 복제되어야 함
      const positions = snake.getPositions();
      const lastTwo = positions.slice(-2);
      expect(lastTwo[0]).toEqual(lastTwo[1]);
    });
  });

  describe('서버 동기화', () => {
    it('서버로부터 받은 상태로 업데이트해야 함', () => {
      const snake = new Snake(mockScene, snakeData);
      
      const newPositions: Position[] = [
        { x: 15, y: 15 },
        { x: 14, y: 15 },
      ];
      const newDirection: Direction = 'up';

      snake.updateFromServer(newPositions, newDirection);

      expect(snake.getPositions()).toEqual(newPositions);
      expect(snake.getDirection()).toBe(newDirection);
    });
  });

  describe('생존 상태', () => {
    it('정상 상태에서는 살아있어야 함', () => {
      const snake = new Snake(mockScene, snakeData);
      expect(snake.isAlive()).toBe(true);
    });

    it('벽에 충돌하면 죽어야 함', () => {
      const deadSnake = new Snake(mockScene, {
        ...snakeData,
        positions: [{ x: -1, y: 10 }],
      });
      expect(deadSnake.isAlive()).toBe(false);
    });

    it('자기 몸에 충돌하면 죽어야 함', () => {
      const deadSnake = new Snake(mockScene, {
        ...snakeData,
        positions: [
          { x: 10, y: 10 },
          { x: 11, y: 10 },
          { x: 10, y: 10 }, // 머리가 몸통과 충돌
        ],
      });
      expect(deadSnake.isAlive()).toBe(false);
    });
  });

  describe('리소스 정리', () => {
    it('destroy() 호출 시 graphics를 정리해야 함', () => {
      const mockGraphics = {
        clear: jest.fn(),
        fillStyle: jest.fn(),
        fillRect: jest.fn(),
        destroy: jest.fn(),
      };
      mockScene.add.graphics.mockReturnValue(mockGraphics);

      const snake = new Snake(mockScene, snakeData);
      snake.destroy();

      expect(mockGraphics.destroy).toHaveBeenCalled();
    });
  });
});