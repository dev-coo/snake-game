# 🐍 Snake Battle - 1:1 온라인 스네이크 게임

실시간 온라인 대전이 가능한 현대적인 스네이크 게임입니다. React와 Phaser 3를 기반으로 제작되었으며, Socket.io를 통해 실시간 멀티플레이를 지원합니다.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.0-blue.svg)

## 🎮 주요 기능

- **실시간 온라인 대전**: 친구와 함께 1:1 대전 가능
- **클래식 모드**: 전통적인 싱글 플레이 스네이크 게임
- **배틀 모드**: 특수 아이템이 등장하는 대전 모드 (2차 개발)
- **반응형 디자인**: 다양한 화면 크기 지원
- **부드러운 게임플레이**: 60 FPS 유지

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript**: UI 프레임워크
- **Phaser 3**: 게임 엔진
- **Zustand**: 상태 관리
- **Socket.io Client**: 실시간 통신
- **Tailwind CSS**: 스타일링
- **Vite**: 빌드 도구

### Backend
- **Node.js** + **Express**: 서버 프레임워크
- **Socket.io**: WebSocket 통신
- **Redis**: 세션 관리
- **TypeScript**: 타입 안정성

### 개발 도구
- **Jest**: 테스트 프레임워크
- **ESLint** + **Prettier**: 코드 품질 관리
- **Monorepo**: Workspace 기반 프로젝트 구조

## 📁 프로젝트 구조

```
snake-game/
├── client/              # React 프론트엔드
│   ├── src/
│   │   ├── components/  # UI 컴포넌트
│   │   ├── game/       # Phaser 게임 로직
│   │   ├── store/      # Zustand 상태 관리
│   │   └── services/   # API 및 Socket 통신
├── server/              # Node.js 백엔드
│   └── src/
│       ├── game/       # 게임 서버 로직
│       └── services/   # 비즈니스 로직
├── shared/              # 공유 타입 및 상수
└── docs/                # 프로젝트 문서
```

## 🚀 시작하기

### 필수 요구사항
- Node.js >= 20.0.0
- npm >= 10.0.0
- Redis (선택사항)

### 설치

```bash
# 저장소 클론
git clone https://github.com/dev-coo/snake-game.git
cd snake-game

# 의존성 설치
npm install
```

### 실행

```bash
# 개발 서버 실행 (클라이언트 + 서버 동시 실행)
npm run dev

# 또는 개별 실행
npm run dev:client  # http://localhost:3000
npm run dev:server  # http://localhost:3001
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage

# 특정 워크스페이스 테스트
npm run test --workspace=client
```

## 🎯 개발 현황

### ✅ 완료된 기능
- [x] 프로젝트 구조 설정
- [x] TypeScript 환경 구성
- [x] Phaser 3 게임 엔진 설정
- [x] Snake, Food 엔티티 구현
- [x] 상태 관리 (Zustand)
- [x] 테스트 환경 및 단위 테스트

### 🚧 진행중
- [ ] GameScene 구현
- [ ] 충돌 감지 시스템
- [ ] React UI 컴포넌트
- [ ] Socket.io 연동

### 📋 예정
- [ ] 서버 API 구현
- [ ] 실시간 동기화
- [ ] 매칭 시스템
- [ ] 특수 아이템 (2차)
- [ ] 리더보드 (2차)

## 🎮 게임 방법

### 조작법
- **WASD** 또는 **방향키**: 뱀 이동
- **ESC**: 일시정지 (싱글 플레이)

### 게임 규칙
1. 먹이를 먹으면 점수와 길이가 증가합니다
2. 벽이나 자신의 몸, 상대방에게 부딪히면 게임 오버입니다
3. 제한 시간 내에 더 높은 점수를 획득한 플레이어가 승리합니다

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📬 문의

프로젝트에 대한 문의사항이나 제안이 있으시면 [Issues](https://github.com/dev-coo/snake-game/issues)에 등록해주세요.

---

Made with ❤️ by Snake Game Developer