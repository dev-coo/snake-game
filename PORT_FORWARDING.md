# 포트포워딩 설정 가이드

## 🌍 외부 네트워크에서 게임 호스팅하기

### 1. 포트포워딩 설정

#### 필요한 포트
- **3000**: 클라이언트 (React 앱)
- **3001**: 서버 (Socket.io)

#### 라우터 설정
1. 라우터 관리 페이지 접속 (보통 192.168.1.1 또는 192.168.0.1)
2. 포트포워딩 메뉴 찾기
3. 다음 규칙 추가:
   - 외부 포트: 3000 → 내부 포트: 3000 → 프로토콜: TCP
   - 외부 포트: 3001 → 내부 포트: 3001 → 프로토콜: TCP/UDP

### 2. 서버 실행

#### 환경 변수 설정 없이 실행
```bash
# 환경 변수 파일을 만들지 않고 바로 실행
npm run dev
```

서버가 자동으로 다음을 감지합니다:
- 로컬 접속: `http://localhost:3001`
- 외부 접속: `http://[외부IP]:3001`

### 3. 접속 방법

#### 호스트 (서버 실행 컴퓨터)
```
http://localhost:3000
```

#### 외부 네트워크에서 접속
```
http://[공인IP]:3000
```

공인 IP 확인: https://whatismyipaddress.com

### 4. 문제 해결

#### "서버에 연결할 수 없습니다" 오류

1. **브라우저 콘솔 확인**
   - F12 > Console 탭
   - 연결 시도 URL 확인
   - 에러 메시지 확인

2. **포트 확인**
   ```bash
   # Windows
   netstat -an | findstr :3001
   
   # Mac/Linux
   netstat -an | grep :3001
   ```

3. **방화벽 확인**
   - Windows Defender 방화벽에서 Node.js 허용
   - 포트 3000, 3001 인바운드 규칙 추가

4. **서버 로그 확인**
   ```
   Server running on 0.0.0.0:3001
   Server is accessible at:
     - http://localhost:3001
     - http://192.168.x.x:3001
   ```

### 5. ngrok을 사용한 대안 (포트포워딩 없이)

포트포워딩이 어려운 경우 ngrok 사용:

1. **ngrok 설치**
   ```bash
   # https://ngrok.com 에서 다운로드
   ```

2. **터널 생성**
   ```bash
   # 터미널 1
   ngrok http 3001
   # 생성된 URL 복사 (예: https://abc123.ngrok.io)
   
   # 터미널 2
   ngrok http 3000
   # 생성된 URL 복사 (예: https://def456.ngrok.io)
   ```

3. **환경 변수 설정**
   ```bash
   # client/.env
   VITE_SERVER_URL=https://abc123.ngrok.io
   ```

4. **접속**
   ```
   https://def456.ngrok.io
   ```

### 6. 보안 주의사항

⚠️ **중요**: 포트포워딩은 보안 위험이 있습니다
- 게임 테스트 후 포트포워딩 비활성화
- 강력한 라우터 관리자 비밀번호 사용
- 필요시에만 포트 열기
- 프로덕션 환경에서는 적절한 인증 구현

### 7. 디버깅 팁

#### 클라이언트 콘솔에서 확인할 사항
```javascript
// 브라우저 콘솔에서 실행
console.log(window.location.hostname)  // 현재 호스트명
console.log(window.location.protocol)  // http: 또는 https:
```

#### 네트워크 탭 확인
- F12 > Network 탭
- WebSocket 연결 확인 (WS 필터)
- 실패한 요청의 상태 코드 확인

### 8. 자주 발생하는 문제

**Q: 로컬에서는 되는데 외부에서 안 됨**
- A: 포트포워딩 설정 확인, 공인 IP 확인

**Q: WebSocket 연결이 계속 실패함**
- A: 서버 포트(3001)가 제대로 포워딩되었는지 확인

**Q: CORS 에러 발생**
- A: 서버가 모든 origin을 허용하도록 설정되어 있으므로 브라우저 캐시 삭제 후 재시도