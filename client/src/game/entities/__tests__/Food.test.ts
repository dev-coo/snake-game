import Food from '../Food';
import { Food as FoodType, Position } from '@snake-game/shared';
import { GAME_CONFIG } from '@snake-game/shared';

describe('Food 클래스 테스트', () => {
  let mockScene: any;
  let mockGraphics: any;

  beforeEach(() => {
    // Mock graphics 객체
    mockGraphics = {
      clear: jest.fn(),
      fillStyle: jest.fn(),
      fillCircle: jest.fn(),
      fillTriangle: jest.fn(),
      lineStyle: jest.fn(),
      strokeCircle: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fillPath: jest.fn(),
      destroy: jest.fn(),
    };

    // Mock Phaser Scene
    mockScene = {
      add: {
        graphics: jest.fn(() => mockGraphics),
      },
    };
  });

  describe('초기화', () => {
    it('일반 먹이를 올바르게 생성해야 함', () => {
      const foodData: FoodType = {
        id: 'food-1',
        position: { x: 5, y: 5 },
        type: 'normal',
        value: 1,
      };

      const food = new Food(mockScene, foodData);

      expect(food).toBeDefined();
      expect(food.getId()).toBe('food-1');
      expect(food.getPosition()).toEqual({ x: 5, y: 5 });
      expect(food.getType()).toBe('normal');
      expect(food.getValue()).toBe(1);
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('다양한 타입의 먹이를 생성할 수 있어야 함', () => {
      const foodTypes: Array<{type: FoodType['type'], value: number}> = [
        { type: 'normal', value: 1 },
        { type: 'golden', value: 3 },
        { type: 'speed', value: 2 },
        { type: 'slow', value: 1 },
        { type: 'invincible', value: 2 },
      ];

      foodTypes.forEach(({ type, value }) => {
        const foodData: FoodType = {
          id: `food-${type}`,
          position: { x: 10, y: 10 },
          type,
          value,
        };

        const food = new Food(mockScene, foodData);
        expect(food.getType()).toBe(type);
        expect(food.getValue()).toBe(value);
      });
    });
  });

  describe('렌더링', () => {
    it('render 메서드가 graphics를 올바르게 호출해야 함', () => {
      const foodData: FoodType = {
        id: 'food-1',
        position: { x: 5, y: 5 },
        type: 'normal',
        value: 1,
      };

      const food = new Food(mockScene, foodData);

      // 초기 렌더링 확인
      expect(mockGraphics.clear).toHaveBeenCalled();
      expect(mockGraphics.fillStyle).toHaveBeenCalled();
      expect(mockGraphics.fillCircle).toHaveBeenCalled();

      // 렌더링 위치 계산 확인
      const expectedX = foodData.position.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const expectedY = foodData.position.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      
      expect(mockGraphics.fillCircle).toHaveBeenCalledWith(
        expectedX,
        expectedY,
        expect.any(Number)
      );
    });

    it('황금 먹이는 특별한 효과가 있어야 함', () => {
      const foodData: FoodType = {
        id: 'golden-food',
        position: { x: 5, y: 5 },
        type: 'golden',
        value: 3,
      };

      const food = new Food(mockScene, foodData);

      // 황금 먹이는 추가 효과가 있음
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
      expect(mockGraphics.strokeCircle).toHaveBeenCalled();
    });

    it('속도 먹이는 화살표 모양이 있어야 함', () => {
      const foodData: FoodType = {
        id: 'speed-food',
        position: { x: 5, y: 5 },
        type: 'speed',
        value: 2,
      };

      const food = new Food(mockScene, foodData);

      // 속도 먹이는 삼각형(화살표)이 그려짐
      expect(mockGraphics.fillTriangle).toHaveBeenCalled();
    });

    it('무적 먹이는 별 모양이 있어야 함', () => {
      const foodData: FoodType = {
        id: 'invincible-food',
        position: { x: 5, y: 5 },
        type: 'invincible',
        value: 2,
      };

      const food = new Food(mockScene, foodData);

      // 무적 먹이는 별 모양을 위한 path 그리기
      expect(mockGraphics.beginPath).toHaveBeenCalled();
      expect(mockGraphics.moveTo).toHaveBeenCalled();
      expect(mockGraphics.lineTo).toHaveBeenCalled();
      expect(mockGraphics.closePath).toHaveBeenCalled();
      expect(mockGraphics.fillPath).toHaveBeenCalled();
    });
  });

  describe('애니메이션', () => {
    it('황금 먹이는 펄스 애니메이션이 있어야 함', () => {
      const foodData: FoodType = {
        id: 'golden-food',
        position: { x: 5, y: 5 },
        type: 'golden',
        value: 3,
      };

      const food = new Food(mockScene, foodData);

      // clear 호출 횟수 초기화
      mockGraphics.clear.mockClear();
      mockGraphics.fillCircle.mockClear();

      // 여러 프레임 업데이트
      food.update(16); // 16ms (60fps)
      expect(mockGraphics.clear).toHaveBeenCalled();
      expect(mockGraphics.fillCircle).toHaveBeenCalled();

      // 펄스 크기가 변경되어야 함
      food.update(160); // 더 많은 시간 경과
      food.update(160);
      food.update(160);

      // 렌더링이 계속 호출되어야 함
      expect(mockGraphics.clear.mock.calls.length).toBeGreaterThan(0);
    });

    it('일반 먹이는 애니메이션이 없어야 함', () => {
      const foodData: FoodType = {
        id: 'normal-food',
        position: { x: 5, y: 5 },
        type: 'normal',
        value: 1,
      };

      const food = new Food(mockScene, foodData);

      // clear 호출 횟수 초기화
      mockGraphics.clear.mockClear();

      // 업데이트 호출
      food.update(16);

      // 일반 먹이는 다시 렌더링하지 않음
      expect(mockGraphics.clear).not.toHaveBeenCalled();
    });
  });

  describe('충돌 검사', () => {
    it('같은 위치에 있을 때 충돌을 감지해야 함', () => {
      const foodData: FoodType = {
        id: 'food-1',
        position: { x: 5, y: 5 },
        type: 'normal',
        value: 1,
      };

      const food = new Food(mockScene, foodData);

      expect(food.checkCollision({ x: 5, y: 5 })).toBe(true);
      expect(food.checkCollision({ x: 4, y: 5 })).toBe(false);
      expect(food.checkCollision({ x: 5, y: 4 })).toBe(false);
      expect(food.checkCollision({ x: 6, y: 6 })).toBe(false);
    });
  });

  describe('섭취 처리', () => {
    it('consume 호출 시 점수를 반환하고 리소스를 정리해야 함', () => {
      const foodData: FoodType = {
        id: 'food-1',
        position: { x: 5, y: 5 },
        type: 'golden',
        value: 3,
      };

      const food = new Food(mockScene, foodData);
      const score = food.consume();

      expect(score).toBe(3);
      expect(mockGraphics.destroy).toHaveBeenCalled();
    });
  });

  describe('위치 업데이트', () => {
    it('서버로부터 받은 새로운 위치로 업데이트해야 함', () => {
      const foodData: FoodType = {
        id: 'food-1',
        position: { x: 5, y: 5 },
        type: 'normal',
        value: 1,
      };

      const food = new Food(mockScene, foodData);
      
      // clear 호출 횟수 초기화
      mockGraphics.clear.mockClear();

      const newPosition: Position = { x: 10, y: 10 };
      food.updatePosition(newPosition);

      expect(food.getPosition()).toEqual(newPosition);
      expect(mockGraphics.clear).toHaveBeenCalled(); // 다시 렌더링됨
    });
  });

  describe('리소스 정리', () => {
    it('destroy 호출 시 graphics를 정리해야 함', () => {
      const foodData: FoodType = {
        id: 'food-1',
        position: { x: 5, y: 5 },
        type: 'normal',
        value: 1,
      };

      const food = new Food(mockScene, foodData);
      food.destroy();

      expect(mockGraphics.destroy).toHaveBeenCalled();
    });
  });

  describe('Getter 메서드', () => {
    it('모든 getter 메서드가 올바른 값을 반환해야 함', () => {
      const foodData: FoodType = {
        id: 'test-food',
        position: { x: 7, y: 8 },
        type: 'speed',
        value: 2,
      };

      const food = new Food(mockScene, foodData);

      expect(food.getId()).toBe('test-food');
      expect(food.getPosition()).toEqual({ x: 7, y: 8 });
      expect(food.getType()).toBe('speed');
      expect(food.getValue()).toBe(2);
    });
  });
});