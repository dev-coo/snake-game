# Snake Battle - 네트워크 설정 가이드

## 🌐 로컬 네트워크에서 게임 실행하기

이 가이드는 같은 네트워크(WiFi, LAN)에 있는 다른 기기에서 게임에 접속할 수 있도록 설정하는 방법을 설명합니다.

### 1. 서버 IP 주소 확인

먼저 서버를 실행할 컴퓨터의 IP 주소를 확인합니다:

**Windows:**
```bash
ipconfig
# IPv4 주소를 찾으세요 (예: 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# 또는
ip addr show
# inet 주소를 찾으세요 (예: 192.168.1.100)
```

### 2. 환경 변수 설정

#### 서버 설정 (server/.env)
```env
PORT=3001
HOST=0.0.0.0
```

#### 클라이언트 설정 (client/.env)
```env
# 서버 컴퓨터의 IP 주소를 입력하세요
VITE_SERVER_URL=http://192.168.1.100:3001
```

### 3. 서버 및 클라이언트 실행

```bash
# 루트 디렉토리에서
npm run dev
```

서버 시작 시 다음과 같은 메시지가 표시됩니다:
```
Server running on 0.0.0.0:3001
Server is accessible at:
  - http://localhost:3001
  - http://192.168.1.100:3001
```

### 4. 게임 접속

**호스트 컴퓨터에서:**
- http://localhost:3000

**같은 네트워크의 다른 기기에서:**
- http://192.168.1.100:3000 (서버 IP 주소 사용)

### 5. 방화벽 설정

접속이 안 될 경우 방화벽 설정을 확인하세요:

**Windows 방화벽:**
1. Windows Defender 방화벽 설정 열기
2. "앱 또는 기능 허용" 클릭
3. Node.js 허용 또는 포트 3000, 3001 열기

**Mac:**
1. 시스템 환경설정 > 보안 및 개인정보 > 방화벽
2. 방화벽 옵션에서 Node.js 허용

**Linux (Ubuntu/Debian):**
```bash
sudo ufw allow 3000
sudo ufw allow 3001
```

### 6. 문제 해결

**연결이 안 될 때:**
1. 서버와 클라이언트가 같은 네트워크에 있는지 확인
2. IP 주소가 올바른지 확인
3. 방화벽 설정 확인
4. 서버 로그에서 에러 메시지 확인

**CORS 에러가 발생할 때:**
- 서버가 모든 origin을 허용하도록 설정되어 있으므로 CORS 에러가 발생하지 않아야 합니다
- 브라우저 캐시를 지우고 다시 시도해보세요

### 7. 프로덕션 배포

실제 배포 시에는 보안을 위해 다음 설정을 권장합니다:

**server/.env:**
```env
CLIENT_URL=https://your-domain.com
NODE_ENV=production
```

**server/src/index.ts에서 CORS 설정 수정:**
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

## 📱 모바일 기기에서 테스트

1. 모바일 기기가 같은 WiFi에 연결되어 있는지 확인
2. 모바일 브라우저에서 `http://[서버IP]:3000` 접속
3. Chrome 또는 Safari 권장

## 🔒 보안 주의사항

- 이 설정은 개발 및 테스트 용도입니다
- 공용 네트워크에서는 사용하지 마세요
- 프로덕션 환경에서는 HTTPS를 사용하고 적절한 인증을 구현하세요