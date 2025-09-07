# 스네이크 게임 아키텍처 설계

## 1. 시스템 개요

### 1.1 아키텍처 패턴
- **클라이언트-서버 모델**: 실시간 온라인 멀티플레이 지원
- **MVC 패턴**: 클라이언트 애플리케이션 구조화
- **이벤트 기반 아키텍처**: 게임 상태 관리 및 네트워크 통신

### 1.2 주요 컴포넌트
```
┌─────────────────┐     ┌─────────────────┐
│   Client A      │     │   Client B      │
│  (Browser)      │     │  (Browser)      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    WebSocket          │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │ Game Server │
              │  (Node.js)  │
              └─────────────┘
```

## 2. 클라이언트 아키텍처

### 2.1 레이어 구조
```
┌─────────────────────────────────────┐
│          Presentation Layer         │ (UI Components)
├─────────────────────────────────────┤
│           Game Logic Layer          │ (Game Rules, State)
├─────────────────────────────────────┤
│          Network Layer              │ (WebSocket Client)
├─────────────────────────────────────┤
│          Rendering Layer            │ (Canvas/WebGL)
└─────────────────────────────────────┘
```

### 2.2 주요 모듈

#### 2.2.1 Game Core
```javascript
/**
 * 게임의 핵심 엔진 클래스
 * 게임의 전체적인 라이프사이클을 관리하고 각 모듈을 조정
 */
GameEngine {
  - gameState: GameState          // 현재 게임 상태를 저장
  - inputHandler: InputHandler    // 사용자 입력 처리 모듈
  - renderer: Renderer            // 화면 렌더링 담당 모듈
  - networkManager: NetworkManager // 네트워크 통신 관리 모듈
  
  + initialize()                  // 게임 초기화 및 모듈 설정
  + update(deltaTime: number)     // 게임 로직 업데이트 (매 프레임 호출)
  + render()                      // 현재 상태를 화면에 렌더링
}
```

#### 2.2.2 Game State
```javascript
/**
 * 게임의 현재 상태를 관리하는 클래스
 * 모든 게임 객체와 상태 정보를 저장하고 업데이트
 */
GameState {
  - players: Map<playerId, Player>   // 플레이어 ID와 플레이어 객체 매핑
  - food: Array<Food>                // 맵에 존재하는 모든 먹이 리스트
  - gameMode: GameMode               // 현재 게임 모드 (classic | battle)
  - timeRemaining: number            // 남은 게임 시간 (초 단위)
  - score: Map<playerId, number>     // 플레이어별 현재 점수
  
  + updatePlayerPosition()           // 모든 플레이어의 위치 업데이트
  + checkCollisions()                // 충돌 감지 (벽, 자기 몸, 상대방)
  + spawnFood()                      // 새로운 먹이 생성 및 배치
  + calculateScore()                 // 점수 계산 및 업데이트
}
```

#### 2.2.3 Entities
```javascript
/**
 * 스네이크 엔티티 클래스
 * 각 플레이어가 조종하는 뱀의 상태와 동작을 관리
 */
Snake {
  - id: string                    // 스네이크 고유 식별자
  - positions: Array<Position>    // 뱀의 각 부분 위치 배열 (머리가 index 0)
  - direction: Direction          // 현재 이동 방향 (up | down | left | right)
  - speed: number                 // 이동 속도 (격자/초)
  - color: string                 // 뱀의 색상 (플레이어 구분용)
  
  + move()                        // 현재 방향으로 한 칸 이동
  + grow()                        // 먹이 섭취 시 길이 증가
  + checkSelfCollision(): boolean // 자기 몸과의 충돌 검사
}

/**
 * 먹이 엔티티 클래스
 * 맵에 생성되는 먹이의 정보를 관리
 */
Food {
  - position: Position            // 먹이의 위치 좌표
  - type: FoodType               // 먹이 종류 (normal | golden | speed 등)
  - value: number                // 획득 시 점수
  
  + consume(): number            // 먹이 섭취 처리 및 점수 반환
}
```

### 2.3 네트워크 통신
```javascript
/**
 * 네트워크 통신을 관리하는 클래스
 * 서버와의 WebSocket 연결 및 데이터 송수신 담당
 */
NetworkManager {
  - socket: WebSocket            // WebSocket 연결 객체
  - roomId: string              // 현재 참여중인 게임 룸 ID
  - playerId: string            // 현재 플레이어의 고유 ID
  
  + connect(url: string)        // 서버에 WebSocket 연결 수립
  + sendGameState(state: any)   // 클라이언트 상태를 서버로 전송
  + receiveGameState()          // 서버로부터 게임 상태 수신
  + handleDisconnect()          // 연결 끊김 처리 및 재연결 시도
}
```

## 3. 서버 아키텍처

### 3.1 레이어 구조
```
┌─────────────────────────────────────┐
│          WebSocket Layer            │
├─────────────────────────────────────┤
│          Game Room Manager          │
├─────────────────────────────────────┤
│         Game Logic Engine           │
├─────────────────────────────────────┤
│        State Synchronization        │
└─────────────────────────────────────┘
```

### 3.2 주요 모듈

#### 3.2.1 Room Manager
```javascript
/**
 * 게임 룸을 관리하는 클래스
 * 룸 생성, 플레이어 매칭, 룸 삭제 등을 담당
 */
RoomManager {
  - rooms: Map<roomId, GameRoom>    // 활성화된 모든 게임 룸 저장
  - waitingPlayers: Array<Player>   // 매칭 대기중인 플레이어 목록
  
  + createRoom(): string            // 새 게임 룸 생성 및 ID 반환
  + joinRoom(playerId, roomId)      // 특정 룸에 플레이어 참가
  + matchPlayers()                  // 대기중인 플레이어들을 자동 매칭
  + removeRoom(roomId)              // 게임 종료 후 룸 삭제
}
```

#### 3.2.2 Game Room
```javascript
/**
 * 개별 게임 룸을 관리하는 클래스
 * 한 게임 세션의 전체 라이프사이클을 담당
 */
GameRoom {
  - roomId: string                // 룸 고유 식별자
  - players: Array<Player>        // 룸에 참가한 플레이어 목록
  - gameState: ServerGameState    // 서버측 게임 상태
  - gameLoop: GameLoop            // 게임 업데이트 루프
  
  + addPlayer(player: Player)     // 룸에 플레이어 추가
  + removePlayer(playerId: string) // 룸에서 플레이어 제거
  + startGame()                   // 게임 시작 (모든 플레이어 준비 완료 시)
  + updateGame()                  // 게임 상태 업데이트 (매 틱마다)
  + broadcastState()              // 모든 플레이어에게 상태 전송
}
```

#### 3.2.3 동기화 엔진
```javascript
/**
 * 클라이언트-서버 간 상태 동기화를 담당하는 엔진
 * 네트워크 지연과 패킷 손실을 보상하여 부드러운 게임플레이 제공
 */
SyncEngine {
  - stateBuffer: StateBuffer      // 과거 상태들을 저장하는 버퍼
  - tickRate: number              // 서버 틱 레이트 (초당 업데이트 횟수)
  
  + synchronizeState()            // 서버와 클라이언트 상태 동기화
  + interpolatePositions()        // 위치 보간으로 부드러운 움직임 구현
  + reconcileClientInput()        // 클라이언트 예측과 서버 상태 조정
  + handleLatency()               // 네트워크 지연 보상 처리
}
```

## 4. 데이터 모델

### 4.1 게임 상태
```typescript
interface GameState {
  gameId: string;
  mode: 'classic' | 'battle';
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  food: Food[];
  timeElapsed: number;
  winner: string | null;
}
```

### 4.2 플레이어 데이터
```typescript
interface Player {
  id: string;
  name: string;
  snake: Snake;
  score: number;
  isAlive: boolean;
  connectionStatus: 'connected' | 'disconnected';
}
```

### 4.3 네트워크 메시지
```typescript
// 클라이언트 → 서버
interface ClientMessage {
  type: 'join' | 'move' | 'leave' | 'restart';
  playerId: string;
  roomId?: string;
  data: any;
}

// 서버 → 클라이언트
interface ServerMessage {
  type: 'gameState' | 'gameStart' | 'gameEnd' | 'playerJoined' | 'playerLeft';
  data: any;
  timestamp: number;
}
```

## 5. 게임 루프 설계

### 5.1 클라이언트 게임 루프
```
1. Input Processing (60Hz)
   - 키보드 입력 캡처
   - 입력 유효성 검증
   - 서버로 입력 전송

2. State Update (서버 동기화)
   - 서버로부터 상태 수신
   - 로컬 예측
   - 보간/외삽

3. Rendering (60 FPS)
   - 게임 상태 렌더링
   - UI 업데이트
   - 애니메이션
```

### 5.2 서버 게임 루프
```
1. Input Collection (High Frequency)
   - 모든 클라이언트 입력 수집
   - 입력 큐잉

2. Game Logic Update (30Hz)
   - 플레이어 이동 계산
   - 충돌 검사
   - 점수 계산
   - 게임 종료 조건 확인

3. State Broadcasting (30Hz)
   - 모든 클라이언트에게 상태 전송
   - 델타 압축 적용
```

## 6. 보안 및 안티치트

### 6.1 서버 권한 모델
- 모든 게임 로직은 서버에서 처리
- 클라이언트는 입력만 전송
- 서버가 모든 상태 변경 검증

### 6.2 입력 검증
```javascript
/**
 * 클라이언트 입력의 유효성을 검증하는 함수
 * 치팅이나 비정상적인 입력을 차단
 * @param {Object} input - 클라이언트로부터 받은 입력 데이터
 * @returns {boolean} - 입력이 유효한지 여부
 */
validateInput(input) {
  - 이동 속도 제한 확인      // 설정된 최대 속도 초과 여부 검사
  - 방향 변경 빈도 제한      // 비정상적으로 빠른 방향 전환 방지
  - 불가능한 위치 이동 방지  // 순간이동이나 벽 통과 등 검사
}
```

### 6.3 연결 보안
- WebSocket Secure (WSS) 사용
- 세션 토큰 기반 인증
- Rate limiting 적용

## 7. 성능 최적화

### 7.1 네트워크 최적화
- **델타 압축**: 변경된 상태만 전송
- **상태 버퍼링**: 네트워크 지연 보상
- **우선순위 큐**: 중요 이벤트 우선 처리

### 7.2 렌더링 최적화
- **더티 플래그**: 변경된 영역만 다시 그리기
- **오브젝트 풀링**: 먹이 객체 재사용
- **캔버스 레이어링**: 정적/동적 요소 분리

### 7.3 메모리 관리
- **가비지 컬렉션 최소화**
- **객체 재사용**
- **메모리 누수 방지**

## 8. 확장성 고려사항

### 8.1 수평 확장
- 게임 룸별 독립적 처리
- 로드 밸런싱 가능한 구조
- 상태 비저장 서버 설계

### 8.2 모듈화
- 게임 모드 플러그인 시스템
- 맵 에디터 인터페이스
- AI 플레이어 추가 가능

### 8.3 2차 개발 대비
- 특수 아이템 시스템 인터페이스
- 매칭메이킹 시스템 훅
- 리더보드 API 준비