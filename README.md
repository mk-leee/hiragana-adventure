# ひらがなアドベンチャー 🦊
### JapanFun Quest — 7~12세 아이들을 위한 일본어 학습 게임

아이가 **게임인 줄 알고 노는 사이에** 히라가나를 마스터하는 앱입니다.

---

## 🎮 주요 기능

| 기능 | 설명 |
|------|------|
| 🦊 히라코 캐릭터 | 여우 학습 파트너 — 5가지 감정, 댄스, 칭찬 |
| 📖 스토리 모드 | "히라코와 일본 여행" 12챕터 |
| 🎯 퀴즈 | 히라가나 4지선다 퀴즈 + 연속정답 보너스 |
| 🎣 낚시 게임 | 실시간 물고기 이동, 정답 히라가나 낚기 |
| 🎈 풍선 게임 | 올라가는 풍선 중 정답 터트리기 |
| ✍️ 쓰기 연습 | 손가락/마우스로 직접 쓰기 |
| 🛒 포인트 샵 | 스티커·아바타·방꾸미기 아이템 10종 |
| 🔒 학부모 모드 | PIN 잠금 — 난이도·시간제한·보상배율 설정 |

## 🚀 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR_USERNAME/hiragana-adventure.git
cd hiragana-adventure

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm start
```

브라우저에서 `http://localhost:3000` 접속

## 🏗 빌드 (배포용)

```bash
npm run build
```

`build/` 폴더를 Vercel, Netlify, GitHub Pages 등에 배포하세요.

## 🔑 학부모 PIN
기본값: **`1234`**  
`src/App.jsx` 내 `REAL_PIN` 상수를 변경하여 커스텀 가능합니다.

## 📚 커리큘럼
- Week 1–2: あ행, か행
- Week 3–4: さ행, た행
- Week 5–6: な행, は행
- Week 7–8: ま행, や행
- Week 9–10: ら행, わ행
- Week 11–12: 복습 + 가타카나 입문

## 🛠 기술 스택
- **React 18** (Create React App)
- **CSS-in-JS** (inline styles + keyframe animations)
- **Canvas API** (쓰기 연습)
- **requestAnimationFrame** (낚시·풍선 실시간 애니메이션)

## 📄 라이선스
MIT License
