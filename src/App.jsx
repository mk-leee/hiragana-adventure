import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import pkg from "../package.json";
const version = pkg.version;

// ============================================================
// DATA
// ============================================================
const HIRAGANA = [
  { char: "あ", rom: "a", stroke: "あ" }, { char: "い", rom: "i" }, { char: "う", rom: "u" },
  { char: "え", rom: "e" }, { char: "お", rom: "o" },
  { char: "か", rom: "ka" }, { char: "き", rom: "ki" }, { char: "く", rom: "ku" },
  { char: "け", rom: "ke" }, { char: "こ", rom: "ko" },
  { char: "さ", rom: "sa" }, { char: "し", rom: "shi" }, { char: "す", rom: "su" },
  { char: "せ", rom: "se" }, { char: "そ", rom: "so" },
  { char: "た", rom: "ta" }, { char: "ち", rom: "chi" }, { char: "つ", rom: "tsu" },
  { char: "て", rom: "te" }, { char: "と", rom: "to" },
  { char: "な", rom: "na" }, { char: "に", rom: "ni" }, { char: "ぬ", rom: "nu" },
  { char: "ね", rom: "ne" }, { char: "の", rom: "no" },
  { char: "は", rom: "ha" }, { char: "ひ", rom: "hi" }, { char: "ふ", rom: "fu" },
  { char: "へ", rom: "he" }, { char: "ほ", rom: "ho" },
  { char: "ま", rom: "ma" }, { char: "み", rom: "mi" }, { char: "む", rom: "mu" },
  { char: "め", rom: "me" }, { char: "も", rom: "mo" },
  { char: "や", rom: "ya" }, { char: "ゆ", rom: "yu" }, { char: "よ", rom: "yo" },
  { char: "ら", rom: "ra" }, { char: "り", rom: "ri" }, { char: "る", rom: "ru" },
  { char: "れ", rom: "re" }, { char: "ろ", rom: "ro" },
  { char: "わ", rom: "wa" }, { char: "を", rom: "wo" }, { char: "ん", rom: "n" },
];

// ============================================================
// SPACED REPETITION SYSTEM
// ============================================================
const SRS_KEY = "hiragana_srs_v1";

function loadSRSWeights() {
  try { const s = localStorage.getItem(SRS_KEY); return s ? JSON.parse(s) : {}; }
  catch { return {}; }
}
function saveSRSWeights(w) {
  try { localStorage.setItem(SRS_KEY, JSON.stringify(w)); } catch {}
}

function useSRS() {
  const weightsRef = useRef(loadSRSWeights());

  const getWeight = (char) => weightsRef.current[char] ?? 1;

  // pool: 출제할 글자 배열(난이도별 서브셋), exclude: 직전 글자 제외
  const pickChar = useCallback((pool = HIRAGANA, exclude = null) => {
    const excludeSet = Array.isArray(exclude) ? new Set(exclude) : new Set(exclude ? [exclude] : []);
    const filtered = pool.filter(h => !excludeSet.has(h.char));
    const ws = filtered.map(h => getWeight(h.char));
    const total = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < filtered.length; i++) {
      r -= ws[i];
      if (r <= 0) return filtered[i];
    }
    return filtered[filtered.length - 1];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recordCorrect = useCallback((char) => {
    const w = weightsRef.current;
    w[char] = Math.max(0.25, (w[char] ?? 1) * 0.6);
    saveSRSWeights(w);
  }, []);

  const recordWrong = useCallback((char) => {
    const w = weightsRef.current;
    w[char] = Math.min(8, (w[char] ?? 1) * 2.5);
    saveSRSWeights(w);
  }, []);

  return { pickChar, recordCorrect, recordWrong };
}

// ============================================================
// DIFFICULTY SYSTEM
// ============================================================
const DIFFICULTY_CONFIG = {
  beginner: { label: "초급",   emoji: "🌱", color: "#4CAF50", charLimit: 15, speedMult: 0.65, entityCount: 4,
              desc: "처음 15자 · 느린 속도" },
  normal:   { label: "보통",   emoji: "🌟", color: "#2196F3", charLimit: 46, speedMult: 1.0,  entityCount: 6,
              desc: "전체 글자 · 보통 속도" },
  hard:     { label: "고급",   emoji: "🔥", color: "#F44336", charLimit: 46, speedMult: 1.6,  entityCount: 8,
              desc: "전체 글자 · 빠른 속도" },
  auto:     { label: "자동 AI", emoji: "🤖", color: "#9C27B0", charLimit: null, speedMult: null, entityCount: null,
              desc: "실력에 맞게 자동 조절" },
};

// SRS 가중치로 실력 수준을 판단 → 자동 난이도 산출
function computeAutoDifficulty() {
  const weights = loadSRSWeights();
  const total = HIRAGANA.reduce((s, h) => s + (weights[h.char] ?? 1), 0);
  const avg = total / HIRAGANA.length;
  if (avg > 2.0) return "beginner";
  if (avg < 0.55) return "hard";
  return "normal";
}

// "auto"면 실제 설정값을 계산해 반환
function resolveConfig(difficulty) {
  if (difficulty === "auto") return DIFFICULTY_CONFIG[computeAutoDifficulty()];
  return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
}

function getCharPool(difficulty) {
  const limit = resolveConfig(difficulty).charLimit;
  return limit ? HIRAGANA.slice(0, limit) : HIRAGANA;
}

const SHOP_ITEMS = [
  { id: 1, name: "별 스티커", emoji: "⭐", price: 10, type: "sticker" },
  { id: 2, name: "하트 스티커", emoji: "❤️", price: 10, type: "sticker" },
  { id: 3, name: "무지개 스티커", emoji: "🌈", price: 20, type: "sticker" },
  { id: 4, name: "히라코 모자", emoji: "🎩", price: 50, type: "avatar" },
  { id: 5, name: "히라코 망토", emoji: "🦸", price: 80, type: "avatar" },
  { id: 6, name: "벚꽃 방", emoji: "🌸", price: 100, type: "room" },
  { id: 7, name: "우주 방", emoji: "🚀", price: 150, type: "room" },
  { id: 8, name: "사탕 방", emoji: "🍭", price: 120, type: "room" },
  { id: 9, name: "닌자 히라코", emoji: "🥷", price: 200, type: "avatar" },
  { id: 10, name: "마법 지팡이", emoji: "✨", price: 60, type: "sticker" },
];

const CHAPTERS = [
  { week: 1, title: "히라코를 만나다", chars: ["あ","い","う","え","お"], unlocked: true },
  { week: 2, title: "도쿄 출발!", chars: ["か","き","く","け","こ"], unlocked: false },
  { week: 3, title: "후지산 등반", chars: ["さ","し","す","せ","そ"], unlocked: false },
  { week: 4, title: "온천 마을", chars: ["た","ち","つ","て","と"], unlocked: false },
  { week: 5, title: "교토의 비밀", chars: ["な","に","ぬ","ね","の"], unlocked: false },
  { week: 6, title: "오사카 축제", chars: ["は","ひ","ふ","へ","ほ"], unlocked: false },
];

const PRAISE = ["すごい！", "やった！", "いいね！", "完璧！", "天才！"];
const FOX_MOODS = { happy: "🦊😄", thinking: "🦊🤔", excited: "🦊🎉", sleepy: "🦊😴", cheer: "🦊📣" };

// ============================================================
// PARTICLE SYSTEM
// ============================================================
function Particles({ active, x, y }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!active) return;
    const ps = Array.from({ length: 18 }, (_, i) => ({
      id: Date.now() + i,
      x: x || 50, y: y || 50,
      dx: (Math.random() - 0.5) * 200,
      dy: -(Math.random() * 150 + 50),
      color: ["#FFD700","#FF69B4","#00CED1","#FF6347","#7CFC00","#DA70D6"][Math.floor(Math.random()*6)],
      size: Math.random() * 12 + 6,
      emoji: ["⭐","✨","🎉","💫","🌟"][Math.floor(Math.random()*5)],
    }));
    setParticles(ps);
    const t = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(t);
  }, [active, x, y]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          fontSize: p.size, animation: "particle-fly 1.2s ease-out forwards",
          "--dx": `${p.dx}px`, "--dy": `${p.dy}px`,
        }}>{p.emoji}</div>
      ))}
    </div>
  );
}

// ============================================================
// HIRAKО CHARACTER
// ============================================================
function Hirako({ mood = "happy", message, size = 80, dancing = false }) {
  return (
    <div style={{ textAlign: "center", display: "inline-block" }}>
      <div style={{
        fontSize: size,
        display: "inline-block",
        animation: dancing ? "dance 0.5s ease-in-out infinite alternate" : "float 3s ease-in-out infinite",
        filter: "drop-shadow(0 4px 12px rgba(255,140,0,0.3))",
      }}>
        {FOX_MOODS[mood]}
      </div>
      {message && (
        <div style={{
          background: "white",
          border: "3px solid #FF8C00",
          borderRadius: 16,
          padding: "8px 14px",
          marginTop: 8,
          fontSize: 14,
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          color: "#333",
          maxWidth: 200,
          position: "relative",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          <span style={{
            position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
            borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
            borderBottom: "10px solid #FF8C00",
          }}/>
          {message}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CANDY REWARD
// ============================================================
function CandyBurst({ count }) {
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
      {Array.from({ length: Math.min(count, 10) }).map((_, i) => (
        <span key={i} style={{
          fontSize: 24, animation: `pop 0.3s ${i * 0.05}s both`,
          display: "inline-block",
        }}>🍬</span>
      ))}
    </div>
  );
}

// ============================================================
// USER PROFILES
// ============================================================
const USERS = [
  { id: "mankyu",  name: "만규", emoji: "🐻", color: "#FF8C00", bg: "#FFF3E0" },
  { id: "hyeonhui", name: "현희", emoji: "🐱", color: "#E91E63", bg: "#FCE4EC" },
  { id: "hayun",  name: "하윤", emoji: "🐰", color: "#9C27B0", bg: "#F3E5F5" },
  { id: "harin",  name: "하린", emoji: "🐸", color: "#2196F3", bg: "#E3F2FD" },
];

function getDefaultUserData() {
  return { points: 0, candies: 0, completedChars: [], owned: [], currentRoom: "🏡", streak: 0,
           difficulty: "auto", playHistory: [], charStages: {} };
}

function savePlayRecord(userId, game, correct, wrong) {
  try {
    const key = `hiragana_user_${userId}`;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : getDefaultUserData();
    const history = data.playHistory || [];
    history.push({ date: new Date().toISOString().slice(0, 10), game, correct, wrong, ts: Date.now() });
    if (history.length > 200) history.splice(0, history.length - 200);
    data.playHistory = history;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function loadUserData(userId) {
  try {
    const saved = localStorage.getItem(`hiragana_user_${userId}`);
    return saved ? { ...getDefaultUserData(), ...JSON.parse(saved) } : getDefaultUserData();
  } catch { return getDefaultUserData(); }
}

function saveUserData(userId, data) {
  try { localStorage.setItem(`hiragana_user_${userId}`, JSON.stringify(data)); } catch {}
}

function loadParentSettings() {
  try {
    const saved = localStorage.getItem("hiragana_parent_settings");
    return saved ? { difficulty: "normal", dailyLimit: 30, rewardMultiplier: 1, ...JSON.parse(saved) } : { difficulty: "normal", dailyLimit: 30, rewardMultiplier: 1 };
  } catch { return { difficulty: "normal", dailyLimit: 30, rewardMultiplier: 1 }; }
}

function saveParentSettings(data) {
  try { localStorage.setItem("hiragana_parent_settings", JSON.stringify(data)); } catch {}
}

// ============================================================
// USER SELECT SCREEN
// ============================================================
function UserSelectScreen({ onSelect }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFF5E6 0%, #FFE4B5 50%, #FFDAB9 100%)",
      fontFamily: "'Nunito', 'Nanum Gothic', sans-serif",
      maxWidth: 430,
      margin: "0 auto",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes bounce-in { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button { cursor: pointer; border: none; outline: none; }
      `}</style>
      <div style={{ fontSize: 72, animation: "float 3s ease-in-out infinite", marginBottom: 8 }}>🦊</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#FF8C00", marginBottom: 4 }}>ひらがな冒険</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#888", marginBottom: 32 }}>누구로 시작할까요?</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%" }}>
        {USERS.map((user, i) => {
          const data = loadUserData(user.id);
          const progress = Math.round((data.completedChars.length / HIRAGANA.length) * 100);
          return (
            <button key={user.id} onClick={() => onSelect(user.id)} style={{
              background: user.bg,
              border: `3px solid ${user.color}`,
              borderRadius: 20, padding: "20px 12px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              animation: `bounce-in 0.4s ${i * 0.1}s both`,
              boxShadow: `0 4px 16px ${user.color}40`,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            onTouchStart={e => e.currentTarget.style.transform = "scale(0.95)"}
            onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <span style={{ fontSize: 48 }}>{user.emoji}</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: user.color }}>{user.name}</span>
              <div style={{ width: "100%", background: "#fff", borderRadius: 8, height: 8, overflow: "hidden", border: `1.5px solid ${user.color}` }}>
                <div style={{ width: `${progress}%`, height: "100%", background: user.color, borderRadius: 8 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#888" }}>⭐{data.points} · {data.completedChars.length}/{HIRAGANA.length}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// DIFFICULTY SELECT SCREEN
// ============================================================
function DifficultySelectScreen({ userInfo, savedDifficulty, onSelect }) {
  const [selected, setSelected] = useState(savedDifficulty || "auto");
  const effectiveLabel = selected === "auto"
    ? `현재 실력: ${DIFFICULTY_CONFIG[computeAutoDifficulty()].label}`
    : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFF5E6 0%, #FFE4B5 50%, #FFDAB9 100%)",
      fontFamily: "'Nunito', 'Nanum Gothic', sans-serif",
      maxWidth: 430, margin: "0 auto",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes bounce-in{0%{transform:scale(0);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}button{cursor:pointer;border:none;outline:none;}`}</style>

      <div style={{ fontSize: 56, animation: "float 3s ease-in-out infinite" }}>{userInfo.emoji}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: userInfo.color, margin: "8px 0 4px" }}>{userInfo.name}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#888", marginBottom: 28 }}>난이도를 선택해주세요</div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setSelected(key)} style={{
            background: selected === key ? cfg.color : "white",
            border: `3px solid ${cfg.color}`,
            borderRadius: 18, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: selected === key ? `0 4px 18px ${cfg.color}60` : "0 2px 8px rgba(0,0,0,0.08)",
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 32 }}>{cfg.emoji}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 900, fontSize: 17, color: selected === key ? "white" : cfg.color }}>{cfg.label}</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: selected === key ? "rgba(255,255,255,0.85)" : "#999" }}>{cfg.desc}</div>
            </div>
            {selected === key && <div style={{ marginLeft: "auto", color: "white", fontSize: 22 }}>✓</div>}
          </button>
        ))}
      </div>

      {effectiveLabel && (
        <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: "#9C27B0",
          background: "#F3E5F5", borderRadius: 12, padding: "6px 16px" }}>
          🤖 {effectiveLabel}
        </div>
      )}

      <button onClick={() => onSelect(selected)} style={{
        marginTop: 28, width: "100%", padding: "16px 0",
        background: "linear-gradient(90deg, #FF8C00, #FF6347)",
        color: "white", borderRadius: 20, fontSize: 18, fontWeight: 900,
        boxShadow: "0 6px 20px rgba(255,100,0,0.35)",
      }}>시작하기 🚀</button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function HiraganaAdventure() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  const handleSelectUser = (userId) => setCurrentUserId(userId);
  const handleSelectDifficulty = (diff) => {
    // 선택한 난이도를 user data에 저장
    const key = `hiragana_user_${currentUserId}`;
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : getDefaultUserData();
      data.difficulty = diff;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
    setDifficulty(diff);
  };
  const handleSwitchUser = () => { setCurrentUserId(null); setDifficulty(null); };

  if (!currentUserId) return <UserSelectScreen onSelect={handleSelectUser} />;
  if (!difficulty) {
    const userInfo = USERS.find(u => u.id === currentUserId);
    const saved = loadUserData(currentUserId).difficulty || "auto";
    return <DifficultySelectScreen userInfo={userInfo} savedDifficulty={saved} onSelect={handleSelectDifficulty} />;
  }
  return <UserApp userId={currentUserId} difficulty={difficulty} onSwitchUser={handleSwitchUser} />;
}

function UserApp({ userId, difficulty, onSwitchUser }) {
  const userData = loadUserData(userId);
  const userInfo = USERS.find(u => u.id === userId);
  const diffCfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
  const onRecord = useCallback((game, correct, wrong) => {
    savePlayRecord(userId, game, correct, wrong);
  }, [userId]);

  const [screen, setScreen] = useState("home"); // home | story | quiz | fishing | balloon | shop | parent | draw
  const [points, setPoints] = useState(userData.points);
  const [candies, setCandies] = useState(userData.candies);
  const [streak, setStreak] = useState(userData.streak || 0);
  const [owned, setOwned] = useState(userData.owned.length ? userData.owned : []);
  const [currentRoom, setCurrentRoom] = useState(userData.currentRoom || "🏡");
  const [foxDancing, setFoxDancing] = useState(false);
  const [foxMessage, setFoxMessage] = useState(`안녕 ${userInfo.name}! 나는 히라코야! 오늘도 같이 공부하자~`);
  const [foxMood, setFoxMood] = useState("happy");
  const [particles, setParticles] = useState(false);
  const [particlePos, setParticlePos] = useState({ x: 50, y: 50 });
  const [completedChars, setCompletedChars] = useState(userData.completedChars);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [parentPin, setParentPin] = useState("");
  const [wrongPin, setWrongPin] = useState(false);
  const [notification, setNotification] = useState(null);
  const [rewardMultiplier, setRewardMultiplier] = useState(() => loadParentSettings().rewardMultiplier);
  const [charStages, setCharStages] = useState(userData.charStages || {});
  const [funnelKey, setFunnelKey] = useState(0);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // Android 뒤로가기 소프트키 가로채기
  useEffect(() => {
    window.history.pushState({ app: true }, "");
    const handlePopState = () => {
      setShowBackConfirm(true);
      window.history.pushState({ app: true }, ""); // 히스토리 재추가 (이탈 방지)
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Save to localStorage whenever key data changes
  useEffect(() => {
    saveUserData(userId, { points, candies, completedChars, owned, currentRoom, streak, charStages });
  }, [userId, points, candies, completedChars, owned, currentRoom, streak, charStages]);

  const triggerParticles = useCallback((x = 50, y = 50) => {
    setParticlePos({ x, y });
    setParticles(true);
    setTimeout(() => setParticles(false), 100);
  }, []);

  const reward = useCallback((pts, msg, mood = "excited", x = 50, y = 50) => {
    const actualPts = Math.round(pts * rewardMultiplier);
    setPoints(p => p + actualPts);
    setCandies(c => c + 1);
    setStreak(s => s + 1);
    setFoxMessage(msg);
    setFoxMood(mood);
    triggerParticles(x, y);
    if ((streak + 1) % 5 === 0) {
      setFoxDancing(true);
      setFoxMessage("5개 연속! 히라코 댄스!!🕺");
      setTimeout(() => setFoxDancing(false), 3000);
    }
    setNotification({ text: `+${actualPts}포인트 🍬`, color: "#FFD700" });
    setTimeout(() => setNotification(null), 1500);
  }, [streak, triggerParticles, rewardMultiplier]);

  const showScreen = (s) => {
    setScreen(s);
    setFoxMessage(
      s === "funnel" ? "4단계로 완벽 마스터해보자! 📚" :
      s === "story" ? "모험을 시작해볼까? 두근두근~" :
      s === "quiz"  ? "퀴즈 준비됐어? 할 수 있어!" :
      s === "fishing" ? "낚시로 히라가나 잡아보자! 🎣" :
      s === "balloon" ? "풍선을 터트려봐! 빵! 💥" :
      s === "shop" ? "뭘 살까? 골라골라~" :
      s === "draw" ? "손가락으로 써봐! ✍️" :
      `안녕 ${userInfo.name}! 나는 히라코야! 오늘도 같이 공부하자~`
    );
    setFoxMood(s === "shop" ? "thinking" : "happy");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFF5E6 0%, #FFE4B5 50%, #FFDAB9 100%)",
      fontFamily: "'Nunito', 'Nanum Gothic', sans-serif",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Noto+Sans+JP:wght@700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes dance { 0%{transform:rotate(-15deg) scale(1.1)} 100%{transform:rotate(15deg) scale(1.15)} }
        @keyframes pop { 0%{transform:scale(0) rotate(-20deg)} 80%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes particle-fly {
          0%{transform:translate(0,0) scale(1); opacity:1}
          100%{transform:translate(var(--dx),var(--dy)) scale(0.3); opacity:0}
        }
        @keyframes wiggle { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
        @keyframes bounce-in { 0%{transform:scale(0) translateY(40px);opacity:0} 70%{transform:scale(1.1) translateY(-5px)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes slide-up { from{transform:translateY(60px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 12px #FFD700} 50%{box-shadow:0 0 28px #FFD700,0 0 48px #FF8C00} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button { cursor: pointer; border: none; outline: none; }
      `}</style>

      <Particles active={particles} x={particlePos.x} y={particlePos.y} />

      {/* TOP BAR */}
      <div style={{
        background: "linear-gradient(90deg, #FF8C00, #FF6347)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 16px rgba(255,100,0,0.3)",
      }}>
        {screen !== "home" ? (
          <button onClick={() => showScreen("home")} style={{
            background: "rgba(255,255,255,0.3)", border: "none", borderRadius: 10,
            color: "white", fontSize: 20, padding: "4px 10px", fontWeight: 900,
          }}>←</button>
        ) : (
          <button onClick={onSwitchUser} title="사용자 바꾸기" style={{
            background: "rgba(255,255,255,0.3)", border: "none", borderRadius: 10,
            color: "white", fontSize: 13, padding: "4px 8px", fontWeight: 900,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span>{userInfo.emoji}</span>
            <span>{userInfo.name}</span>
          </button>
        )}
        <div style={{ color: "white", fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
          ひらがな冒険
          <span style={{
            background: "rgba(255,255,255,0.22)", borderRadius: 10,
            padding: "2px 7px", fontSize: 11, fontWeight: 800,
          }}>{diffCfg.emoji} {diffCfg.label}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            background: "rgba(255,255,255,0.25)", borderRadius: 20,
            padding: "4px 10px", color: "white", fontSize: 13, fontWeight: 800,
          }}>⭐{points}</div>
          <div style={{
            background: "rgba(255,255,255,0.25)", borderRadius: 20,
            padding: "4px 10px", color: "white", fontSize: 13, fontWeight: 800,
          }}>🍬{candies}</div>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: notification.color, color: "#333",
          borderRadius: 20, padding: "8px 20px", fontSize: 16, fontWeight: 900,
          zIndex: 9998, animation: "bounce-in 0.4s ease",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>{notification.text}</div>
      )}


      <div style={{ padding: 16 }}>
        {screen === "home" && <HomeScreen showScreen={showScreen} reward={reward} completedChars={completedChars} foxDancing={foxDancing} foxMessage={foxMessage} foxMood={foxMood} setScreen={setScreen} setParentUnlocked={setParentUnlocked} charStages={charStages} />}
        {screen === "funnel" && <LearningFunnelScreen key={funnelKey} reward={reward} triggerParticles={triggerParticles} difficulty={difficulty} onRecord={onRecord} charStages={charStages} setCharStages={setCharStages} onHome={() => showScreen("home")} onNewSession={() => setFunnelKey(k => k + 1)} />}
        {screen === "story" && <StoryScreen reward={reward} completedChars={completedChars} setCompletedChars={setCompletedChars} foxMood={foxMood} setFoxMood={setFoxMood} setFoxMessage={setFoxMessage} triggerParticles={triggerParticles} />}
        {screen === "quiz" && <QuizScreen reward={reward} triggerParticles={triggerParticles} setFoxMessage={setFoxMessage} setFoxMood={setFoxMood} difficulty={difficulty} onRecord={onRecord} />}
        {screen === "fishing" && <FishingGame reward={reward} triggerParticles={triggerParticles} difficulty={difficulty} onRecord={onRecord} />}
        {screen === "balloon" && <BalloonGame reward={reward} triggerParticles={triggerParticles} difficulty={difficulty} onRecord={onRecord} />}
        {screen === "shop" && <ShopScreen points={points} setPoints={setPoints} owned={owned} setOwned={setOwned} setCurrentRoom={setCurrentRoom} />}
        {screen === "draw" && <DrawScreen reward={reward} triggerParticles={triggerParticles} difficulty={difficulty} onRecord={onRecord} />}
        {screen === "parent" && <ParentScreen parentUnlocked={parentUnlocked} setParentUnlocked={setParentUnlocked} parentPin={parentPin} setParentPin={setParentPin} wrongPin={wrongPin} setWrongPin={setWrongPin} completedChars={completedChars} points={points} candies={candies} setRewardMultiplier={setRewardMultiplier} />}
      </div>

      {/* FOX ASSISTANT — always visible on home */}
      {screen === "home" && (
        <div style={{ textAlign: "center", paddingBottom: 20 }}>
          <Hirako mood={foxMood} message={foxMessage} size={70} dancing={foxDancing} />
        </div>
      )}
      <div style={{ textAlign: "center", padding: "8px 0 16px", fontSize: 11, color: "#ccc", fontWeight: 700 }}>
        v{version}
      </div>

      {/* 뒤로가기 확인 다이얼로그 */}
      {showBackConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "white", borderRadius: 20, padding: "28px 24px",
            width: 280, textAlign: "center",
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🦊</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#333", marginBottom: 6 }}>
              이 화면을 나가시겠어요?
            </div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
              학습 진행 중이라면 저장되지 않을 수 있어요
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowBackConfirm(false)} style={{
                flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 15, fontWeight: 900,
                background: "#F5F5F5", color: "#555", border: "none",
              }}>취소</button>
              <button onClick={() => {
                setShowBackConfirm(false);
                window.history.go(-2); // 앱 히스토리 2개(pushState×2) 뒤로
              }} style={{
                flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 15, fontWeight: 900,
                background: "linear-gradient(135deg, #FF8C00, #FF6347)",
                color: "white", border: "none",
              }}>나가기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HOME SCREEN
// ============================================================
function HomeScreen({ showScreen, reward, completedChars, foxDancing, foxMessage, foxMood, setScreen, charStages }) {
  const progress = (completedChars.length / HIRAGANA.length) * 100;
  const stageCounts = [0,0,0,0,0];
  HIRAGANA.forEach(h => { stageCounts[charStages[h.char] || 0]++; });

  const menus = [
    { id: "funnel",  icon: "📚", label: "단계별 학습",   color: "#FF6F00", bg: "#FFF8E1", highlight: true },
    { id: "story",   icon: "📖", label: "스토리 모험",   color: "#FF8C00", bg: "#FFF3E0" },
    { id: "quiz",    icon: "🎯", label: "퀴즈 도전",     color: "#E91E63", bg: "#FCE4EC" },
    { id: "fishing", icon: "🎣", label: "낚시 게임",     color: "#2196F3", bg: "#E3F2FD" },
    { id: "balloon", icon: "🎈", label: "풍선 터트리기", color: "#9C27B0", bg: "#F3E5F5" },
    { id: "draw",    icon: "✍️", label: "써보기",        color: "#4CAF50", bg: "#E8F5E9" },
    { id: "shop",    icon: "🛒", label: "포인트 샵",     color: "#FF5722", bg: "#FBE9E7" },
  ];

  return (
    <div>
      {/* PROGRESS BAR */}
      <div style={{
        background: "white", borderRadius: 20, padding: 16, marginBottom: 16,
        boxShadow: "0 4px 20px rgba(255,140,0,0.15)",
        border: "3px solid #FFD700",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 900, fontSize: 14, color: "#FF8C00" }}>📚 히라가나 마스터 진도</span>
          <span style={{ fontWeight: 900, fontSize: 14, color: "#FF8C00" }}>{completedChars.length}/{HIRAGANA.length}</span>
        </div>
        <div style={{ background: "#FFF0CC", borderRadius: 10, height: 18, overflow: "hidden", border: "2px solid #FFD700" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: "linear-gradient(90deg, #FFD700, #FF8C00)",
            borderRadius: 10, transition: "width 0.8s ease",
            display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 4,
          }}>
            {progress > 15 && <span style={{ fontSize: 10, fontWeight: 900, color: "white" }}>{Math.round(progress)}%</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {completedChars.map(c => (
            <span key={c} style={{
              background: "linear-gradient(135deg, #FFD700, #FF8C00)",
              color: "white", borderRadius: 8, padding: "2px 8px",
              fontSize: 16, fontWeight: 900, animation: "wiggle 2s infinite",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>{c}</span>
          ))}
        </div>
      </div>

      {/* FUNNEL PROGRESS */}
      <div style={{ background: "white", borderRadius: 20, padding: "14px 16px", marginBottom: 14, border: "2px solid #FFE0B2", boxShadow: "0 2px 12px rgba(255,111,0,0.1)" }}>
        <div style={{ fontWeight: 900, fontSize: 13, color: "#FF6F00", marginBottom: 10 }}>📚 단계별 학습 현황</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{n:0,label:"미학습",color:"#E0E0E0"},{n:1,label:"매칭",color:"#FF8C00"},{n:2,label:"인식",color:"#2196F3"},{n:3,label:"듣기",color:"#9C27B0"},{n:4,label:"마스터",color:"#4CAF50"}].map(s => (
            <div key={s.n} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: s.color }}>{stageCounts[s.n]}</div>
              <div style={{ height: 6, background: s.color, borderRadius: 4, opacity: 0.7, marginTop: 2 }}/>
              <div style={{ fontSize: 9, color: "#AAA", fontWeight: 700, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MENU GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {menus.map(m => (
          <button key={m.id} onClick={() => showScreen(m.id)} style={{
            background: m.bg,
            border: `3px solid ${m.color}`,
            borderRadius: 20, padding: "18px 12px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: m.highlight ? `0 6px 20px ${m.color}60` : `0 4px 14px ${m.color}40`,
            animation: "slide-up 0.5s ease both",
            gridColumn: m.highlight ? "1 / -1" : undefined,
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          onTouchStart={e => e.currentTarget.style.transform = "scale(0.95)"}
          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <span style={{ fontSize: m.highlight ? 42 : 36 }}>{m.icon}</span>
            <span style={{ fontSize: m.highlight ? 15 : 13, fontWeight: 900, color: m.color }}>{m.label}</span>
            {m.highlight && <span style={{ fontSize: 11, color: m.color, opacity: 0.7, fontWeight: 700 }}>매칭 → 인식 → 듣기 → 쓰기</span>}
          </button>
        ))}
      </div>

      {/* PARENT MODE BUTTON */}
      <button onClick={() => showScreen("parent")} style={{
        width: "100%", background: "#333", color: "#aaa",
        borderRadius: 14, padding: "10px", fontSize: 12, fontWeight: 700,
        border: "2px solid #555", letterSpacing: 1,
      }}>🔒 학부모 모드</button>
    </div>
  );
}

// ============================================================
// STORY SCREEN
// ============================================================
function StoryScreen({ reward, completedChars, setCompletedChars, setFoxMood, setFoxMessage, triggerParticles }) {
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(null);
  const [charIndex, setCharIndex] = useState(0);
  const [lessonStep, setLessonStep] = useState(0); // 0:chapter list  1:learn  2:quiz  3:complete
  const [quizResult, setQuizResult] = useState(null); // null | "correct" | "wrong"
  const [wrongChoice, setWrongChoice] = useState(null);
  const [quizChoices, setQuizChoices] = useState([]);
  const storyProcessingRef = useRef(false);
  const [unlockedChapters, setUnlockedChapters] = useState(() =>
    CHAPTERS.map((ch, i) => {
      if (i === 0) return true;
      // 이전 챕터의 모든 글자를 완료했으면 언락
      const prevChapter = CHAPTERS[i - 1];
      return prevChapter.chars.every(c => completedChars.includes(c));
    })
  );

  const lessonChar = currentChapter ? currentChapter.chars[charIndex] : null;

  const goNextChar = useCallback(() => {
    setQuizResult(null);
    if (charIndex + 1 < currentChapter.chars.length) {
      const nextIndex = charIndex + 1;
      const nextChar = currentChapter.chars[nextIndex];
      const c = HIRAGANA.find(h => h.char === nextChar);
      setQuizChoices([c.rom, ...HIRAGANA.filter(h => h.char !== nextChar).sort(() => Math.random()-0.5).slice(0,3).map(h => h.rom)].sort(() => Math.random()-0.5));
      setCharIndex(nextIndex);
      setLessonStep(2); // skip intro for subsequent questions
    } else {
      // 다음 챕터 언락
      setUnlockedChapters(prev => {
        const next = [...prev];
        if (currentChapterIndex + 1 < CHAPTERS.length) {
          next[currentChapterIndex + 1] = true;
        }
        return next;
      });
      setLessonStep(3); // chapter complete
    }
  }, [charIndex, currentChapter, currentChapterIndex]);

  if (lessonStep === 3) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 72, animation: "dance 0.5s ease-in-out infinite alternate" }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#FF8C00", margin: "12px 0 4px" }}>
          챕터 완료!
        </div>
        <div style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
          {currentChapter.chars.join(" · ")} 모두 배웠어요!
        </div>
        <button onClick={() => { setCurrentChapter(null); setCharIndex(0); setLessonStep(0); }} style={{
          background: "linear-gradient(135deg, #FF8C00, #FF6347)",
          color: "white", borderRadius: 20, padding: "14px 40px",
          fontSize: 16, fontWeight: 900, boxShadow: "0 4px 16px rgba(255,100,0,0.4)",
        }}>챕터 목록으로 →</button>
      </div>
    );
  }

  if (lessonChar && lessonStep === 1) {
    const char = HIRAGANA.find(h => h.char === lessonChar);
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>
            {charIndex + 1} / {currentChapter.chars.length}
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            fontSize: 100, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900,
            background: "linear-gradient(135deg, #FF8C00, #FF6347)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "float 2s ease-in-out infinite",
            lineHeight: 1.2,
          }}>{char.char}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FF8C00", marginTop: 4 }}>
            「{char.rom}」
          </div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
            히라코가 말해줄게: <strong>{char.rom}!</strong> 따라해봐~
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button onClick={() => {
            const c = HIRAGANA.find(h => h.char === lessonChar);
            setQuizChoices([c.rom, ...HIRAGANA.filter(h => h.char !== lessonChar).sort(() => Math.random()-0.5).slice(0,3).map(h => h.rom)].sort(() => Math.random()-0.5));
            setLessonStep(2);
          }} style={{
            background: "linear-gradient(135deg, #FF8C00, #FF6347)",
            color: "white", borderRadius: 20, padding: "14px 40px",
            fontSize: 16, fontWeight: 900,
            boxShadow: "0 4px 16px rgba(255,100,0,0.4)",
            animation: "pulse 2s infinite",
          }}>퀴즈 풀기 →</button>
        </div>
      </div>
    );
  }

  if (lessonChar && lessonStep === 2) {
    const char = HIRAGANA.find(h => h.char === lessonChar);
    const choices = quizChoices;
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>
            {charIndex + 1} / {currentChapter.chars.length}
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{
            fontSize: 90, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900, color: "#FF8C00",
          }}>{char.char}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#555" }}>이 히라가나의 읽기는?</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {choices.map(c => (
            <button key={c} onClick={() => {
              if (storyProcessingRef.current || quizResult) return;
              storyProcessingRef.current = true;
              if (c === char.rom) {
                setQuizResult("correct");
                setWrongChoice(null);
                if (!completedChars.includes(char.char)) {
                  setCompletedChars(prev => [...prev, char.char]);
                }
                reward(15, `${PRAISE[Math.floor(Math.random()*PRAISE.length)]} 맞았어!`, "excited");
                setTimeout(() => { storyProcessingRef.current = false; setQuizResult(null); setWrongChoice(null); goNextChar(); }, 1200);
              } else {
                setQuizResult("wrong");
                setWrongChoice(c);
                setTimeout(() => { storyProcessingRef.current = false; setQuizResult(null); setWrongChoice(null); }, 1600);
              }
            }} style={{
              padding: "20px 10px",
              borderRadius: 16,
              fontSize: 20, fontWeight: 900,
              background: c === char.rom && (quizResult === "correct" || quizResult === "wrong") ? "#4CAF50" :
                          quizResult === "wrong" && c === wrongChoice ? "#FF5252" :
                          "white",
              color: c === char.rom && (quizResult === "correct" || quizResult === "wrong") ? "white" :
                     quizResult === "wrong" && c === wrongChoice ? "white" : "#333",
              border: "3px solid #FFD700",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transition: "all 0.2s",
            }}>{c}</button>
          ))}
        </div>
        {quizResult === "wrong" && (
          <div style={{ marginTop: 14, padding: "10px 16px", borderRadius: 12, background: "#FFF3E0", border: "2px solid #FFA726", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#999", fontWeight: 700, marginBottom: 2 }}>오답 해설</div>
            <div style={{ fontSize: 14, color: "#E65100", fontWeight: 900 }}>
              「{char.char}」는 <span style={{ fontSize: 22 }}>{char.rom}</span> 소리입니다
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#FF8C00", marginBottom: 12, textAlign: "center" }}>
        📖 히라코와 일본 여행 — 챕터 선택
      </div>
      {CHAPTERS.map((ch, i) => {
        const isUnlocked = unlockedChapters[i];
        return (
          <button key={i} onClick={() => {
            if (!isUnlocked) return;
            setCurrentChapter(ch);
            setCurrentChapterIndex(i);
            setCharIndex(0);
            setLessonStep(1);
          }} style={{
            width: "100%", marginBottom: 10,
            background: isUnlocked ? "linear-gradient(135deg, #FFF9E6, #FFF3CC)" : "#EEE",
            border: isUnlocked ? "3px solid #FFD700" : "3px solid #CCC",
            borderRadius: 16, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
            opacity: isUnlocked ? 1 : 0.5,
            boxShadow: isUnlocked ? "0 4px 12px rgba(255,215,0,0.3)" : "none",
          }}>
            <div style={{ fontSize: 32 }}>{isUnlocked ? "🗺️" : "🔒"}</div>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: isUnlocked ? "#FF8C00" : "#999" }}>
                Week {ch.week}: {ch.title}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                {ch.chars.join(" · ")}
              </div>
            </div>
            <div style={{ fontSize: 18 }}>{isUnlocked ? "▶" : "🔒"}</div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// QUIZ SCREEN
// ============================================================
function QuizScreen({ reward, triggerParticles, setFoxMessage, setFoxMood, difficulty = "normal", onRecord }) {
  const { pickChar, recordCorrect, recordWrong } = useSRS();
  const charPool = useMemo(() => getCharPool(difficulty), [difficulty]); // stable ref
  const [current, setCurrent] = useState(() => pickChar(charPool));
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [shake, setShake] = useState(false);
  const processingRef = useRef(false);
  const statsRef = useRef({ correct: 0, wrong: 0 });

  useEffect(() => {
    const stats = statsRef.current;
    return () => { if (onRecord) onRecord("quiz", stats.correct, stats.wrong); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const makeChoices = useCallback((correct) => {
    const others = charPool.filter(h => h.char !== correct.char)
      .sort(() => Math.random()-0.5).slice(0,3);
    return [correct, ...others].sort(() => Math.random()-0.5);
  }, [charPool]);

  // choices는 current가 바뀔 때만 재생성 (makeChoices도 charPool이 변할 때만 재생성)
  useEffect(() => {
    setChoices(makeChoices(current));
  }, [current, makeChoices]);

  const next = useCallback((exclude = null) => {
    const n = pickChar(charPool, exclude);
    setCurrent(n); // useEffect가 choices를 갱신함 — 여기서 setChoices 호출 불필요
    setSelected(null);
  }, [pickChar, charPool]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (c) => {
    if (processingRef.current || selected) return;
    processingRef.current = true;
    setSelected(c);
    setTotal(t => t + 1);
    if (c.char === current.char) {
      recordCorrect(current.char);
      statsRef.current.correct++;
      setScore(s => s + 1);
      reward(10, PRAISE[Math.floor(Math.random()*PRAISE.length)] + " 정답!", "excited");
      setTimeout(() => { processingRef.current = false; next(current.char); }, 1000);
    } else {
      recordWrong(current.char);
      statsRef.current.wrong++;
      setShake(true);
      setFoxMessage(`정답은 「${current.char}」= ${current.rom} 이야!`);
      setFoxMood("thinking");
      setTimeout(() => setShake(false), 400);
      // processingRef는 유지 — 해설 탭 시 해제
    }
  };

  const dismissWrong = () => {
    processingRef.current = false;
    next();
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>점수: {score}/{total}</div>
        <div style={{
          display: "inline-flex", gap: 4, marginTop: 4,
        }}>
          {Array.from({length:Math.min(score,10)}).map((_,i) => <span key={i} style={{fontSize:16}}>⭐</span>)}
        </div>
      </div>
      <div style={{
        textAlign: "center", marginBottom: 24,
        animation: shake ? "wiggle 0.4s ease" : "none",
      }}>
        <div style={{ fontSize: 14, color: "#888", marginBottom: 8, fontWeight: 700 }}>
          이 소리는 무엇일까요?
        </div>
        <div style={{
          fontSize: 26, fontWeight: 900, color: "#FF8C00", letterSpacing: 4,
          background: "white", borderRadius: 20, padding: "10px 20px",
          display: "inline-block", boxShadow: "0 4px 20px rgba(255,140,0,0.2)",
          border: "3px solid #FFD700",
        }}>「 {current.rom} 」</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {choices.map(c => {
          const isCorrect = c.char === current.char;
          const isSelected = selected?.char === c.char;
          let bg = "white", border = "3px solid #FFD700", color = "#333";
          if (selected) {
            if (isCorrect) { bg = "linear-gradient(135deg,#4CAF50,#8BC34A)"; color = "white"; border = "3px solid #4CAF50"; }
            else if (isSelected) { bg = "#FF5252"; color = "white"; border = "3px solid #FF5252"; }
          }
          return (
            <button key={c.char} onClick={() => pick(c)} style={{
              padding: "22px 8px",
              borderRadius: 20,
              fontSize: 44,
              fontFamily: "'Noto Sans JP', sans-serif",
              fontWeight: 900,
              background: bg, color, border,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              transition: "all 0.2s",
              lineHeight: 1,
            }}>{c.char}</button>
          );
        })}
      </div>
      {selected && selected.char !== current.char && (
        <button onClick={dismissWrong} style={{
          marginTop: 12, padding: "12px 14px", borderRadius: 12,
          background: "#FFF3E0", border: "2px solid #FFA726", textAlign: "center",
          width: "100%", cursor: "pointer",
        }}>
          <div style={{ fontSize: 12, color: "#999", fontWeight: 700, marginBottom: 2 }}>오답 해설</div>
          <div style={{ fontSize: 14, color: "#E65100", fontWeight: 900 }}>
            「{current.rom}」는 <span style={{ fontSize: 26, fontFamily: "'Noto Sans JP', sans-serif" }}>{current.char}</span> 입니다
          </div>
          <div style={{ fontSize: 12, color: "#FFA726", fontWeight: 800, marginTop: 8 }}>
            탭하여 다음 문제로 →
          </div>
        </button>
      )}
      {selected && selected.char === current.char && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <CandyBurst count={score % 5 || 1} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// FISHING GAME
// ============================================================
function FishingGame({ reward, triggerParticles, difficulty = "normal", onRecord }) {
  const { pickChar, recordCorrect, recordWrong } = useSRS();
  const charPool = getCharPool(difficulty);
  const cfg = resolveConfig(difficulty);
  const fishCount = cfg.entityCount;
  const statsRef = useRef({ correct: 0, wrong: 0 });

  useEffect(() => {
    const stats = statsRef.current;
    return () => { if (onRecord) onRecord("fishing", stats.correct, stats.wrong); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const makeFish = (excludeId, targetChar) => ({
    id: excludeId ?? Date.now(),
    char: charPool[Math.floor(Math.random()*charPool.length)],
    x: Math.random()*70+5, y: Math.random()*40+30,
    speed: (Math.random()*0.5+0.3) * cfg.speedMult,
    dir: Math.random()>0.5?1:-1,
  });

  const [fish, setFish] = useState(() => Array.from({length: fishCount}, (_, i) => makeFish(i)));
  const [target, setTarget] = useState(() => pickChar(charPool));
  const [caught, setCaught] = useState([]);
  const [miss, setMiss] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const animRef = useRef();
  const catchingRef = useRef(false);
  const targetRef = useRef(target);
  const feedbackTimerRef = useRef();

  useEffect(() => { targetRef.current = target; }, [target]);

  // 초기 마운트 시 물고기 중 하나를 target으로 교체
  useEffect(() => {
    setFish(prev => {
      const idx = Math.floor(Math.random() * prev.length);
      return prev.map((f, i) => i === idx ? { ...f, char: targetRef.current } : f);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const move = () => {
      setFish(prev => prev.map(f => {
        let nx = f.x + f.speed * f.dir * 0.4;
        let dir = f.dir;
        if (nx > 90 || nx < 5) { dir = -dir; nx = Math.max(5, Math.min(90, nx)); }
        return { ...f, x: nx, dir };
      }));
      animRef.current = requestAnimationFrame(move);
    };
    animRef.current = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const showFeedback = (msg, correct) => {
    clearTimeout(feedbackTimerRef.current);
    setFeedback({ msg, correct });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1800);
  };

  const catchFish = (f) => {
    if (catchingRef.current) return;
    if (f.char.char === target.char) {
      catchingRef.current = true;
      recordCorrect(target.char);
      statsRef.current.correct++;
      setCaught(prev => [...prev, f.char.char]);
      const newTarget = pickChar(charPool, target.char);
      setFish(prev => {
        const filtered = prev.filter(x => x.id !== f.id);
        return [...filtered, {
          id: Date.now(), char: newTarget,
          x: Math.random()*70+5, y: Math.random()*40+30,
          speed: (Math.random()*0.5+0.3) * cfg.speedMult, dir: Math.random()>0.5?1:-1,
        }];
      });
      reward(20, `「${target.char}」 낚았어! 잘했어!`, "excited");
      showFeedback(`${target.char} → ${target.rom} (정답!)`, true);
      setTarget(newTarget);
      setTimeout(() => { catchingRef.current = false; }, 400);
    } else {
      recordWrong(target.char);
      statsRef.current.wrong++;
      setMiss(m => m + 1);
      triggerParticles(f.x, f.y);
      showFeedback(`「${f.char.char}」는 ${f.char.rom} 소리입니다`, false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#666" }}>이것을 낚아라!</div>
        <div style={{
          fontSize: 60, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900,
          color: "#2196F3", animation: "float 2s ease-in-out infinite",
        }}>{target.char}</div>
      </div>

      <div style={{
        height: 240, background: "linear-gradient(180deg, #87CEEB 0%, #4FC3F7 40%, #0288D1 100%)",
        borderRadius: 24, position: "relative", overflow: "hidden",
        border: "4px solid #0277BD", boxShadow: "inset 0 -8px 20px rgba(0,0,0,0.2)",
      }}>
        {/* waves */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
          background: "rgba(255,255,255,0.15)", borderRadius: "50% 50% 0 0",
        }} />
        {fish.map(f => (
          <button key={f.id} onClick={() => catchFish(f)} style={{
            position: "absolute",
            left: `${f.x}%`, top: `${f.y}%`,
            transform: `scaleX(${f.dir}) translateX(-50%) translateY(-50%)`,
            background: "none", border: "none",
            fontSize: 28, cursor: "pointer",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            transition: "left 0.1s linear",
          }}>
            <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>
              🐟
            </span>
            <span style={{
              position: "absolute", top: -18, left: "50%",
              transform: "translateX(-50%) scaleX(-1)",
              fontSize: 14, fontFamily: "sans-serif", fontWeight: 900,
              color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
            }}>{f.char.rom}</span>
          </button>
        ))}
      </div>

      {feedback && (
        <div style={{
          marginTop: 10, padding: "8px 14px", borderRadius: 12, textAlign: "center",
          fontWeight: 700, fontSize: 14,
          background: feedback.correct ? "#E8F5E9" : "#FFF3E0",
          color: feedback.correct ? "#2E7D32" : "#E65100",
          border: `2px solid ${feedback.correct ? "#66BB6A" : "#FFA726"}`,
        }}>{feedback.msg}</div>
      )}

      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2196F3" }}>✅ 잡은 것: {caught.length}마리</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#FF5252" }}>❌ 실수: {miss}번</div>
      </div>
    </div>
  );
}

// ============================================================
// BALLOON GAME
// ============================================================
function BalloonGame({ reward, triggerParticles, difficulty = "normal", onRecord }) {
  const { pickChar, recordCorrect, recordWrong } = useSRS();
  const charPool = getCharPool(difficulty);
  const cfg = resolveConfig(difficulty);
  const balloonCount = cfg.entityCount;
  const statsRef = useRef({ correct: 0, wrong: 0 });

  useEffect(() => {
    const stats = statsRef.current;
    return () => { if (onRecord) onRecord("balloon", stats.correct, stats.wrong); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const BALLOON_COLORS = ["#F44336","#E91E63","#9C27B0","#2196F3","#009688","#FF9800"];
  const laneWidth = 80 / balloonCount;
  const [balloons, setBalloons] = useState(() => Array.from({length: balloonCount}, (_,i) => ({
    id: i,
    lane: i,
    char: charPool[Math.floor(Math.random()*charPool.length)],
    x: 10 + i * laneWidth + laneWidth * 0.5,
    y: 80 + Math.random() * 15,
    speed: (Math.random()*0.3+0.15) * cfg.speedMult,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
  })));
  const [target, setTarget] = useState(() => pickChar(charPool));
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const animRef = useRef();
  const poppingRef = useRef(false);
  const targetRef = useRef(target);
  const feedbackTimerRef = useRef();

  // targetRef를 항상 최신 target으로 동기화
  useEffect(() => { targetRef.current = target; }, [target]);

  // 초기 마운트 시 풍선 중 하나를 target으로 교체
  useEffect(() => {
    setBalloons(prev => {
      const idx = Math.floor(Math.random() * prev.length);
      return prev.map((b, i) => i === idx ? { ...b, char: targetRef.current } : b);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const move = () => {
      setBalloons(prev => {
        // 아직 화면에 target 글자가 있는지 확인
        let targetVisible = false;
        const next = prev.map(b => {
          const ny = b.y - b.speed * 0.3;
          if (ny >= -15) {
            if (b.char.char === targetRef.current.char) targetVisible = true;
            return { ...b, y: ny };
          }
          return null; // 교체 필요 마킹
        });
        // 교체 필요한 풍선 처리 (target 보장, 레인 기반 x 재배치)
        return next.map((b, i) => {
          if (b !== null) return b;
          const orig = prev[i];
          const newX = 10 + orig.lane * laneWidth + laneWidth * 0.5 + (Math.random() - 0.5) * laneWidth * 0.4;
          if (!targetVisible) {
            targetVisible = true;
            return { ...orig, y: 95, x: newX, char: targetRef.current };
          }
          return { ...orig, y: 95, x: newX, char: charPool[Math.floor(Math.random()*charPool.length)] };
        });
      });
      animRef.current = requestAnimationFrame(move);
    };
    animRef.current = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showFeedback = (msg, correct) => {
    clearTimeout(feedbackTimerRef.current);
    setFeedback({ msg, correct });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1800);
  };

  const pop = (b, e) => {
    if (poppingRef.current) return;
    if (b.char.char === target.char) {
      poppingRef.current = true;
      recordCorrect(target.char);
      statsRef.current.correct++;
      const newTarget = pickChar(charPool, target.char);
      setBalloons(prev => prev.map(x => x.id === b.id
        ? { ...x, y: 95, x: 10 + b.lane * laneWidth + laneWidth * 0.5 + (Math.random() - 0.5) * laneWidth * 0.4, char: newTarget }
        : x
      ));
      reward(15, "빵! 맞췄어! 🎉", "excited");
      showFeedback(`${target.char} → ${target.rom} (정답!)`, true);
      setScore(s => s + 1);
      setTarget(newTarget);
      setTimeout(() => { poppingRef.current = false; }, 400);
    } else {
      recordWrong(target.char);
      statsRef.current.wrong++;
      triggerParticles(b.x, b.y);
      showFeedback(`「${b.char.char}」는 ${b.char.rom} 소리입니다`, false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#666" }}>이 풍선을 터트려라!</div>
        <div style={{
          fontSize: 56, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900,
          color: "#9C27B0", animation: "float 1.5s ease-in-out infinite",
        }}>{target.char}</div>
      </div>

      <div style={{
        height: 280, background: "linear-gradient(180deg, #E0F7FA 0%, #B2EBF2 100%)",
        borderRadius: 24, position: "relative", overflow: "hidden",
        border: "4px solid #00ACC1",
      }}>
        {balloons.map(b => (
          <button key={b.id} onClick={(e) => pop(b, e)} style={{
            position: "absolute",
            left: `${b.x}%`, top: `${b.y}%`,
            transform: "translateX(-50%) translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            {/* 풍선 몸통 */}
            <div style={{
              width: 58, height: 64,
              background: `radial-gradient(circle at 35% 35%, ${b.color}CC, ${b.color})`,
              borderRadius: "50% 50% 50% 50% / 55% 55% 45% 45%",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `inset -5px -5px 10px rgba(0,0,0,0.2), inset 5px 5px 10px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.25)`,
              position: "relative",
            }}>
              {/* 반사광 */}
              <div style={{
                position: "absolute", top: 10, left: 14,
                width: 14, height: 10,
                background: "rgba(255,255,255,0.5)",
                borderRadius: "50%", transform: "rotate(-30deg)",
              }} />
              <span style={{
                fontSize: 15, fontWeight: 900, color: "white",
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                fontFamily: "'Nunito', sans-serif",
                letterSpacing: 0,
              }}>{b.char.rom}</span>
            </div>
            {/* 풍선 꼭지 */}
            <div style={{
              width: 0, height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: `8px solid ${b.color}`,
              marginTop: -1,
            }} />
            {/* 실 */}
            <div style={{ width: 1.5, height: 12, background: "#aaa" }} />
          </button>
        ))}
      </div>

      {feedback && (
        <div style={{
          marginTop: 10, padding: "8px 14px", borderRadius: 12, textAlign: "center",
          fontWeight: 700, fontSize: 14,
          background: feedback.correct ? "#E8F5E9" : "#FFF3E0",
          color: feedback.correct ? "#2E7D32" : "#E65100",
          border: `2px solid ${feedback.correct ? "#66BB6A" : "#FFA726"}`,
        }}>{feedback.msg}</div>
      )}

      <div style={{ marginTop: 8, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#9C27B0" }}>
        터트린 풍선: {score}개 🎈
      </div>
    </div>
  );
}

// ============================================================
// DRAW SCREEN
// ============================================================
function DrawScreen({ reward, triggerParticles, difficulty = "normal", onRecord }) {
  const { pickChar, recordCorrect } = useSRS();
  const charPool = getCharPool(difficulty);
  const practiceRef = useRef({ count: 0 });
  useEffect(() => {
    const pr = practiceRef.current;
    return () => { if (onRecord) onRecord("draw", pr.count, 0); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [target, setTarget] = useState(() => pickChar(charPool));
  const [done, setDone] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    const canvas = canvasRef.current;
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#FF8C00";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    if (!hasDrawn) setHasDrawn(true);
  };

  const endDraw = (e) => {
    e.preventDefault();
    setDrawing(false);
  };

  const check = () => {
    if (!hasDrawn || done) return;
    setDone(true);
    reward(20, `잘 썼어! 「${target.char}」 완벽해!`, "excited");
    triggerParticles(50, 30);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDone(false);
    setHasDrawn(false);
  };

  const nextChar = () => {
    recordCorrect(target.char);
    practiceRef.current.count++;
    setTarget(pickChar(charPool, target.char));
    clear();
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#666" }}>이 히라가나를 따라 써보세요!</div>
        <div style={{
          fontSize: 80, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900,
          color: "#4CAF50", opacity: 0.25, lineHeight: 1,
        }}>{target.char}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#4CAF50", marginTop: -4 }}>「{target.rom}」</div>
      </div>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: "4px solid #4CAF50" }}>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 120, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900,
          color: "#4CAF50", opacity: 0.12, pointerEvents: "none", userSelect: "none",
          zIndex: 0,
        }}>{target.char}</div>
        <canvas ref={canvasRef} width={380} height={280}
          style={{ display: "block", width: "100%", background: "white", touchAction: "none", position: "relative", zIndex: 1 }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={clear} style={{
          flex: 1, padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 800,
          background: "#EEE", color: "#666", border: "2px solid #CCC",
        }}>🗑 지우기</button>
        <button onClick={check} disabled={!hasDrawn || done} style={{
          flex: 2, padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 800,
          background: (!hasDrawn || done) ? "#CCC" : "linear-gradient(135deg, #4CAF50, #8BC34A)",
          color: (!hasDrawn || done) ? "#999" : "white",
          border: "none", boxShadow: (!hasDrawn || done) ? "none" : "0 4px 12px rgba(76,175,80,0.4)",
          animation: (!hasDrawn || done) ? "none" : "pulse 2s infinite",
        }}>✅ 완료! 별 받기 ⭐</button>
      </div>
      {done && (
        <div style={{ textAlign: "center", marginTop: 16, animation: "bounce-in 0.5s ease" }}>
          <div style={{ fontSize: 40 }}>🎉⭐🌟⭐🎉</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#4CAF50", marginBottom: 10 }}>훌륭해요! +20포인트!</div>
          <button onClick={nextChar} style={{
            padding: "12px 28px", borderRadius: 14, fontSize: 15, fontWeight: 800,
            background: "linear-gradient(135deg, #FF8C00, #FFB300)", color: "white",
            border: "none", boxShadow: "0 4px 12px rgba(255,140,0,0.4)",
          }}>다음 글자 ➡</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LEARNING FUNNEL
// ============================================================
function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = 0.8;
    window.speechSynthesis.speak(u);
  } catch {}
}

function FunnelStageBar({ stage }) {
  const stages = [
    { n: 1, icon: "🔗", label: "매칭" },
    { n: 2, icon: "👁", label: "인식" },
    { n: 3, icon: "👂", label: "듣기" },
    { n: 4, icon: "✏️", label: "쓰기" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 18 }}>
      {stages.map((s, i) => (
        <div key={s.n} style={{ display: "contents" }}>
          <div style={{
            flex: 1, padding: "8px 4px", borderRadius: 12, textAlign: "center",
            background: stage > s.n ? "#4CAF50" : stage === s.n ? "linear-gradient(135deg,#FF8C00,#FF6347)" : "#E8E8E8",
            color: stage >= s.n ? "white" : "#AAA", fontWeight: 900, fontSize: 11,
            boxShadow: stage === s.n ? "0 3px 10px rgba(255,140,0,0.45)" : "none",
          }}>
            <div style={{ fontSize: 15, marginBottom: 2 }}>{stage > s.n ? "✓" : s.icon}</div>
            <div>{s.label}</div>
          </div>
          {i < 3 && <div style={{ color: "#CCC", fontSize: 10, flexShrink: 0 }}>▶</div>}
        </div>
      ))}
    </div>
  );
}

// 단계 1: 매칭 — 히라가나 ↔ 로마자 짝 맞추기
function Stage1Matching({ chars, onComplete }) {
  const [romOrder] = useState(() => [...chars].sort(() => Math.random()-0.5));
  const [leftSel, setLeftSel] = useState(null);
  const [rightSel, setRightSel] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [flash, setFlash] = useState(null);

  const doMatch = (leftIdx, rightIdx) => {
    if (chars[leftIdx].char === romOrder[rightIdx].char) {
      const next = new Set(matched); next.add(chars[leftIdx].char);
      setMatched(next); setFlash("ok");
      setTimeout(() => {
        setFlash(null); setLeftSel(null); setRightSel(null);
        if (next.size === chars.length) setTimeout(onComplete, 500);
      }, 500);
    } else {
      setLeftSel(leftIdx); setRightSel(rightIdx); setFlash("no");
      setTimeout(() => { setFlash(null); setLeftSel(null); setRightSel(null); }, 700);
    }
  };

  const handleLeft = (i) => {
    if (matched.has(chars[i].char) || flash) return;
    if (rightSel !== null) { doMatch(i, rightSel); return; }
    setLeftSel(i); setRightSel(null);
  };

  const handleRight = (i) => {
    if (matched.has(romOrder[i].char) || flash) return;
    if (leftSel !== null) { doMatch(leftSel, i); return; }
    setRightSel(i); setLeftSel(null);
  };

  const cardBase = (isMatched, isSel, side) => ({
    width: "100%", padding: "12px 6px", marginBottom: 8, borderRadius: 14,
    fontWeight: 900, textAlign: "center", cursor: isMatched ? "default" : "pointer",
    fontSize: side === "left" ? 30 : 16,
    fontFamily: side === "left" ? "'Noto Sans JP', sans-serif" : "sans-serif",
    border: `3px solid ${isMatched ? "#4CAF50" : isSel ? (flash === "no" ? "#F44336" : "#FF8C00") : "#DDD"}`,
    background: isMatched ? "#E8F5E9" : isSel ? (flash === "no" ? "#FFEBEE" : "#FFF8E1") : "white",
    color: isMatched ? "#388E3C" : isSel ? (flash === "no" ? "#C62828" : "#E65100") : "#333",
    opacity: isMatched ? 0.55 : 1, transition: "all 0.15s",
  });

  return (
    <div>
      <div style={{ textAlign: "center", fontSize: 13, color: "#888", fontWeight: 700, marginBottom: 14 }}>
        히라가나와 발음을 짝지어 보세요 ✅ {matched.size}/{chars.length}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          {chars.map((c, i) => (
            <button key={c.char} onClick={() => handleLeft(i)} style={cardBase(matched.has(c.char), leftSel === i, "left")}>
              {c.char}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, color: "#CCC", fontSize: 22 }}>↔</div>
        <div style={{ flex: 1 }}>
          {romOrder.map((c, i) => (
            <button key={c.rom+i} onClick={() => handleRight(i)} style={cardBase(matched.has(c.char), rightSel === i, "right")}>
              {c.rom}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 단계 2: 인식 — 히라가나 보고 발음 선택
function Stage2Recognition({ chars, onComplete }) {
  const mkChoices = (c) => [c, ...chars.filter(h => h.char !== c.char).sort(() => Math.random()-0.5).slice(0,3)].sort(() => Math.random()-0.5);
  const [queue] = useState(() => [...chars].sort(() => Math.random()-0.5));
  const [idx, setIdx] = useState(0);
  const [choices, setChoices] = useState(() => mkChoices(chars[0]));
  const [sel, setSel] = useState(null);
  const idxRef = useRef(0);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  const pick = (c) => {
    if (sel) return;
    setSel(c);
    const ok = c.char === cur.char;
    setTimeout(() => {
      const ci = idxRef.current;
      if (ci + 1 >= queue.length) { onComplete(); return; }
      setChoices(mkChoices(queue[ci + 1]));
      setIdx(ci + 1); setSel(null);
    }, ok ? 700 : 1500);
  };

  const cur = queue[idx];
  const isOk = (c) => sel && c.char === cur.char;
  const isNg = (c) => sel && sel.char === c.char && c.char !== cur.char;

  return (
    <div>
      <div style={{ textAlign: "center", fontSize: 12, color: "#AAA", fontWeight: 700, marginBottom: 8 }}>{idx+1} / {queue.length}</div>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 76, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900, color: "#222", lineHeight: 1.1 }}>{cur.char}</div>
        <div style={{ fontSize: 13, color: "#AAA", fontWeight: 700, marginTop: 4 }}>이 글자의 발음은?</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {choices.map(c => (
          <button key={c.char} onClick={() => pick(c)} style={{
            padding: "16px 8px", borderRadius: 16, fontWeight: 900, fontSize: 20,
            border: `3px solid ${isOk(c) ? "#4CAF50" : isNg(c) ? "#F44336" : "#DDD"}`,
            background: isOk(c) ? "#E8F5E9" : isNg(c) ? "#FFEBEE" : "white",
            color: isOk(c) ? "#2E7D32" : isNg(c) ? "#C62828" : "#333",
          }}>{c.rom}</button>
        ))}
      </div>
      {sel && sel.char !== cur.char && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: "#FFF3E0", border: "2px solid #FFA726", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#999", fontWeight: 700, marginBottom: 2 }}>오답 해설</div>
          <div style={{ fontSize: 14, color: "#E65100", fontWeight: 900 }}>
            「{cur.char}」는 <span style={{ fontSize: 20 }}>{cur.rom}</span> 소리입니다
          </div>
        </div>
      )}
    </div>
  );
}

// 단계 3: 듣기 — 소리 듣고 히라가나 선택
function Stage3Listening({ chars, onComplete }) {
  const mkChoices = (c) => [c, ...chars.filter(h => h.char !== c.char).sort(() => Math.random()-0.5).slice(0,3)].sort(() => Math.random()-0.5);
  const [queue] = useState(() => [...chars].sort(() => Math.random()-0.5));
  const [idx, setIdx] = useState(0);
  const [choices, setChoices] = useState(() => mkChoices(chars[0]));
  const [sel, setSel] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const idxRef = useRef(0);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { setShowHint(false); }, [idx]);

  const hasTTS = typeof window !== "undefined" && !!window.speechSynthesis;
  const cur = queue[idx];

  const playSound = useCallback(() => {
    if (!hasTTS) return;
    setPlaying(true); speak(cur.char);
    setTimeout(() => setPlaying(false), 1000);
  }, [cur, hasTTS]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setTimeout(playSound, 350); }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (c) => {
    if (sel) return;
    setSel(c);
    const ok = c.char === cur.char;
    setTimeout(() => {
      const ci = idxRef.current;
      if (ci + 1 >= queue.length) { onComplete(); return; }
      setChoices(mkChoices(queue[ci + 1]));
      setIdx(ci + 1); setSel(null);
    }, ok ? 700 : 1500);
  };

  const isOk = (c) => sel && c.char === cur.char;
  const isNg = (c) => sel && sel.char === c.char && c.char !== cur.char;

  return (
    <div>
      <div style={{ textAlign: "center", fontSize: 12, color: "#AAA", fontWeight: 700, marginBottom: 8 }}>{idx+1} / {queue.length}</div>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        {hasTTS ? (
          <>
            <button onClick={playSound} style={{
              fontSize: 52, padding: "16px 28px", borderRadius: 24,
              background: playing ? "#FFF3E0" : "white",
              border: `3px solid ${playing ? "#FF8C00" : "#DDD"}`,
              boxShadow: playing ? "0 0 20px rgba(255,140,0,0.3)" : "0 2px 8px rgba(0,0,0,0.07)",
              animation: playing ? "pulse 0.5s infinite" : "none",
            }}>🔊</button>
            <div style={{ fontSize: 12, color: "#AAA", fontWeight: 700, marginTop: 6 }}>탭하여 다시 듣기</div>
          </>
        ) : (
          <div style={{ padding: "10px 16px", background: "#FFF8E1", border: "2px solid #FFD54F", borderRadius: 12, fontSize: 13, color: "#F57F17", fontWeight: 700 }}>
            ⚠️ 이 기기는 음성을 지원하지 않습니다. 힌트를 사용하세요.
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>
          {hasTTS ? "소리에 맞는 히라가나를 선택하세요" : "발음에 맞는 히라가나를 선택하세요"}
        </div>
        <button onClick={() => setShowHint(h => !h)} style={{
          fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 10,
          background: showHint ? "#FFF3E0" : "#F5F5F5",
          border: `2px solid ${showHint ? "#FF8C00" : "#DDD"}`,
          color: showHint ? "#FF8C00" : "#999",
        }}>💡 힌트</button>
      </div>
      {showHint && (
        <div style={{ textAlign: "center", marginBottom: 10, fontSize: 18, fontWeight: 900, color: "#FF8C00",
          background: "#FFF8E1", borderRadius: 12, padding: "8px", border: "2px solid #FFD54F" }}>
          발음: <span style={{ fontSize: 22 }}>{cur.rom}</span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {choices.map(c => (
          <button key={c.char} onClick={() => pick(c)} style={{
            padding: "16px 8px", borderRadius: 16, fontWeight: 900, fontSize: 34,
            fontFamily: "'Noto Sans JP', sans-serif",
            border: `3px solid ${isOk(c) ? "#4CAF50" : isNg(c) ? "#F44336" : "#DDD"}`,
            background: isOk(c) ? "#E8F5E9" : isNg(c) ? "#FFEBEE" : "white",
            color: isOk(c) ? "#2E7D32" : isNg(c) ? "#C62828" : "#333",
          }}>{c.char}</button>
        ))}
      </div>
      {sel && sel.char !== cur.char && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: "#FFF3E0", border: "2px solid #FFA726", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#999", fontWeight: 700, marginBottom: 2 }}>오답 해설</div>
          <div style={{ fontSize: 14, color: "#E65100", fontWeight: 900 }}>
            정답은 <span style={{ fontSize: 26, fontFamily: "'Noto Sans JP', sans-serif" }}>{cur.char}</span> ({cur.rom}) 입니다
          </div>
        </div>
      )}
    </div>
  );
}

// 단계 4: 쓰기 — 히라가나 보고 발음 입력
function Stage4Input({ chars, onComplete }) {
  const [queue] = useState(() => [...chars].sort(() => Math.random()-0.5));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    setInput(""); setResult(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [idx]);

  const cur = queue[idx];

  const submit = () => {
    if (result) return;
    const ok = input.trim().toLowerCase() === cur.rom.toLowerCase();
    setResult(ok ? "ok" : "ng");
    if (ok) {
      setTimeout(() => {
        if (idx + 1 >= queue.length) onComplete();
        else setIdx(i => i + 1);
      }, 800);
    } else {
      setTimeout(() => { setResult(null); setInput(""); }, 1300);
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", fontSize: 12, color: "#AAA", fontWeight: 700, marginBottom: 8 }}>{idx+1} / {queue.length}</div>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 76, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900, color: "#222", lineHeight: 1.1 }}>{cur.char}</div>
        <div style={{ fontSize: 13, color: "#AAA", fontWeight: 700, marginTop: 4 }}>로마자로 입력하세요</div>
      </div>
      <div style={{
        borderRadius: 16, border: `3px solid ${result === "ok" ? "#4CAF50" : result === "ng" ? "#F44336" : "#DDD"}`,
        background: result === "ok" ? "#E8F5E9" : result === "ng" ? "#FFEBEE" : "white",
        padding: "4px 16px", marginBottom: 10, transition: "all 0.2s",
      }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="입력하세요"
          style={{
            width: "100%", border: "none", outline: "none",
            fontSize: 26, fontWeight: 900, textAlign: "center", background: "transparent",
            padding: "12px 0",
            color: result === "ok" ? "#2E7D32" : result === "ng" ? "#C62828" : "#333",
          }}
        />
      </div>
      {result === "ng" && (
        <div style={{ padding: "10px 14px", borderRadius: 12, background: "#FFF3E0", border: "2px solid #FFA726", textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "#999", fontWeight: 700, marginBottom: 2 }}>오답 해설</div>
          <div style={{ fontSize: 14, color: "#E65100", fontWeight: 900 }}>
            「{cur.char}」의 발음은 <span style={{ fontSize: 22 }}>{cur.rom}</span> 입니다
          </div>
        </div>
      )}
      <button onClick={submit} style={{
        width: "100%", padding: "14px", borderRadius: 16, fontSize: 16, fontWeight: 900,
        background: "linear-gradient(90deg, #FF8C00, #FF6347)", color: "white", border: "none",
        boxShadow: "0 4px 14px rgba(255,140,0,0.35)",
      }}>확인 ✓</button>
    </div>
  );
}

// 메인 학습 퍼널 화면
function LearningFunnelScreen({ reward, triggerParticles, difficulty, onRecord, charStages, setCharStages, onHome, onNewSession }) {
  const { pickChar, recordCorrect } = useSRS();
  const charPool = getCharPool(difficulty);

  const [sessionChars] = useState(() => {
    const picked = [];
    for (let i = 0; i < 5; i++) picked.push(pickChar(charPool, picked.map(c => c.char)));
    return picked;
  });
  const [stage, setStage] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [done, setDone] = useState(false);

  const handleStageComplete = (n) => {
    setTransitioning(true);
    setCharStages(prev => {
      const next = { ...prev };
      sessionChars.forEach(c => { next[c.char] = Math.max(next[c.char] || 0, n); });
      return next;
    });
    setTimeout(() => {
      setTransitioning(false);
      if (n < 4) setStage(n + 1);
      else {
        sessionChars.forEach(c => recordCorrect(c.char));
        reward(60, "4단계 완료! 완벽 마스터! 🏆", "excited");
        if (onRecord) onRecord("funnel", 5, 0);
        setDone(true);
      }
    }, 1200);
  };

  if (done) return (
    <div style={{ textAlign: "center", animation: "bounce-in 0.5s ease" }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#FF8C00", marginBottom: 4 }}>4단계 완료!</div>
      <div style={{ fontSize: 14, color: "#888", marginBottom: 20 }}>오늘 마스터한 글자</div>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
        {sessionChars.map(c => (
          <div key={c.char} style={{ padding: "12px 16px", background: "#E8F5E9", border: "2px solid #4CAF50", borderRadius: 16, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900 }}>{c.char}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#2E7D32" }}>{c.rom}</div>
          </div>
        ))}
      </div>
      <button onClick={onNewSession} style={{
        width: "100%", padding: "14px", borderRadius: 16, fontSize: 16, fontWeight: 900,
        background: "linear-gradient(90deg, #FF8C00, #FF6347)", color: "white", border: "none",
        boxShadow: "0 4px 14px rgba(255,140,0,0.35)", marginBottom: 10,
      }}>새 세션 (다른 글자) 🔄</button>
      <button onClick={onHome} style={{
        width: "100%", padding: "14px", borderRadius: 16, fontSize: 15, fontWeight: 800,
        background: "#EEE", color: "#666", border: "2px solid #CCC",
      }}>홈으로</button>
    </div>
  );

  if (transitioning) return (
    <div style={{ textAlign: "center", padding: "70px 0", animation: "bounce-in 0.4s ease" }}>
      <div style={{ fontSize: 60 }}>{["🔗","👁","👂","✏️"][stage-1]}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: "#FF8C00", marginTop: 12 }}>{stage}단계 완료!</div>
      <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>훌륭해요! 다음 단계로 이동 중...</div>
    </div>
  );

  return (
    <div>
      <FunnelStageBar stage={stage} />
      <div style={{ background: "white", borderRadius: 20, padding: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "2px solid #F0F0F0" }}>
        {stage === 1 && <Stage1Matching chars={sessionChars} onComplete={() => handleStageComplete(1)} />}
        {stage === 2 && <Stage2Recognition chars={sessionChars} onComplete={() => handleStageComplete(2)} />}
        {stage === 3 && <Stage3Listening chars={sessionChars} onComplete={() => handleStageComplete(3)} />}
        {stage === 4 && <Stage4Input chars={sessionChars} onComplete={() => handleStageComplete(4)} />}
      </div>
      <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8 }}>
        {sessionChars.map(c => (
          <div key={c.char} style={{
            padding: "6px 10px", borderRadius: 10, textAlign: "center",
            background: (charStages[c.char] || 0) >= 4 ? "#E8F5E9" : "white",
            border: `2px solid ${(charStages[c.char] || 0) >= 4 ? "#4CAF50" : "#DDD"}`,
            fontSize: 20, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900,
          }}>{c.char}</div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SHOP SCREEN
// ============================================================
function ShopScreen({ points, setPoints, owned, setOwned, setCurrentRoom }) {
  const [tab, setTab] = useState("sticker");
  const [bought, setBought] = useState(null);
  const buyingRef = useRef(false);
  const tabs = [
    { id: "sticker", label: "스티커", icon: "🌟" },
    { id: "avatar", label: "아바타", icon: "🦊" },
    { id: "room", label: "방꾸미기", icon: "🏠" },
  ];
  const filtered = SHOP_ITEMS.filter(i => i.type === tab);

  const buy = (item) => {
    if (buyingRef.current || owned.includes(item.id)) return;
    buyingRef.current = true;
    if (points < item.price) {
      setBought("fail");
      setTimeout(() => { setBought(null); buyingRef.current = false; }, 1000);
      return;
    }
    setPoints(p => p - item.price);
    setOwned(prev => [...prev, item.id]);
    if (item.type === "room") setCurrentRoom(item.emoji);
    setBought(item.id);
    setTimeout(() => { setBought(null); buyingRef.current = false; }, 1200);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 14, fontSize: 12, fontWeight: 800,
            background: tab === t.id ? "linear-gradient(135deg, #FF8C00, #FF6347)" : "white",
            color: tab === t.id ? "white" : "#888",
            border: tab === t.id ? "none" : "2px solid #EEE",
            boxShadow: tab === t.id ? "0 4px 12px rgba(255,100,0,0.3)" : "none",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {bought === "fail" && (
        <div style={{
          background: "#FF5252", color: "white", borderRadius: 14,
          padding: "10px", textAlign: "center", fontWeight: 800, marginBottom: 10,
          animation: "wiggle 0.4s ease",
        }}>⭐ 포인트가 부족해요! 퀴즈를 더 풀어봐요!</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filtered.map(item => {
          const isOwned = owned.includes(item.id);
          const justBought = bought === item.id;
          return (
            <button key={item.id} onClick={() => buy(item)} style={{
              padding: "16px 10px", borderRadius: 18, textAlign: "center",
              background: isOwned ? "linear-gradient(135deg, #E8F5E9, #C8E6C9)" : justBought ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "white",
              border: isOwned ? "3px solid #4CAF50" : justBought ? "3px solid #FF8C00" : "3px solid #FFD700",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              transition: "all 0.2s",
              animation: justBought ? "bounce-in 0.4s ease" : "none",
            }}>
              <div style={{ fontSize: 40, marginBottom: 6 }}>{item.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#555", marginBottom: 4 }}>{item.name}</div>
              {isOwned
                ? <div style={{ fontSize: 11, fontWeight: 800, color: "#4CAF50" }}>✅ 보유중</div>
                : <div style={{
                    background: "linear-gradient(135deg, #FF8C00, #FF6347)",
                    color: "white", borderRadius: 10, padding: "3px 8px",
                    fontSize: 12, fontWeight: 800, display: "inline-block",
                  }}>⭐ {item.price}</div>
              }
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// PARENT SCREEN
// ============================================================
function ParentScreen({ parentUnlocked, setParentUnlocked, parentPin, setParentPin, wrongPin, setWrongPin, completedChars, points, candies, setRewardMultiplier: setParentRewardMultiplier }) {
  const REAL_PIN = "1234";
  const settings = loadParentSettings();
  const [difficulty, setDifficulty] = useState(settings.difficulty);
  const [dailyLimit, setDailyLimit] = useState(settings.dailyLimit);
  const [rewardMultiplier, setRewardMultiplier] = useState(settings.rewardMultiplier);

  useEffect(() => {
    saveParentSettings({ difficulty, dailyLimit, rewardMultiplier });
    setParentRewardMultiplier(rewardMultiplier);
  }, [difficulty, dailyLimit, rewardMultiplier, setParentRewardMultiplier]);

  if (!parentUnlocked) {
    return (
      <div style={{ textAlign: "center", paddingTop: 20 }}>
        <div style={{ fontSize: 50, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#333", marginBottom: 6 }}>학부모 모드</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>아이에게 보이지 않아요</div>
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>PIN 입력 (기본: 1234)</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: parentPin.length >= i ? "#FF8C00" : "#EEE",
              border: "2px solid #FFD700",
              transition: "background 0.2s",
            }}/>
          ))}
        </div>
        {wrongPin && <div style={{ color: "#FF5252", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>PIN이 틀렸어요</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, maxWidth: 200, margin: "0 auto" }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, i) => (
            <button key={i} onClick={() => {
              if (k === "") return;
              if (k === "⌫") { setParentPin(p => p.slice(0,-1)); return; }
              const newPin = parentPin + k;
              setParentPin(newPin);
              if (newPin.length === 4) {
                if (newPin === REAL_PIN) { setParentUnlocked(true); setParentPin(""); setWrongPin(false); }
                else { setWrongPin(true); setParentPin(""); }
              }
            }} style={{
              padding: "12px", borderRadius: 12, fontSize: 16, fontWeight: 800,
              background: k === "⌫" ? "#FF5252" : "white",
              color: k === "⌫" ? "white" : "#333",
              border: "2px solid #FFD700",
              opacity: k === "" ? 0 : 1,
            }}>{k}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 30 }}>👨‍👩‍👧 학부모 설정</div>
        <div style={{ fontSize: 12, color: "#888" }}>아이가 볼 수 없는 화면이에요</div>
      </div>

      {[
        { label: "🎓 학습 난이도", value: difficulty, options: [{v:"easy",l:"쉬움 😊"},{v:"normal",l:"보통 📚"},{v:"hard",l:"어려움 🏆"}], setter: setDifficulty },
      ].map(ctrl => (
        <div key={ctrl.label} style={{ marginBottom: 16, background: "white", borderRadius: 16, padding: 14, border: "2px solid #FFD700" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#FF8C00", marginBottom: 10 }}>{ctrl.label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {ctrl.options.map(o => (
              <button key={o.v} onClick={() => ctrl.setter(o.v)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: ctrl.value === o.v ? "linear-gradient(135deg, #FF8C00, #FF6347)" : "#F5F5F5",
                color: ctrl.value === o.v ? "white" : "#666",
                border: "none",
              }}>{o.l}</button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: "white", borderRadius: 16, padding: 14, border: "2px solid #FFD700", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#FF8C00", marginBottom: 8 }}>
          ⏱ 일일 학습 시간 제한: {dailyLimit}분
        </div>
        <input type="range" min={10} max={120} step={5} value={dailyLimit} onChange={e => setDailyLimit(+e.target.value)}
          style={{ width: "100%", accentColor: "#FF8C00" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa" }}>
          <span>10분</span><span>60분</span><span>120분</span>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: 14, border: "2px solid #FFD700", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#FF8C00", marginBottom: 8 }}>
          🎁 보상 배율: {rewardMultiplier}x
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[0.5,1,1.5,2].map(v => (
            <button key={v} onClick={() => setRewardMultiplier(v)} style={{
              flex: 1, padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: rewardMultiplier === v ? "linear-gradient(135deg, #4CAF50, #8BC34A)" : "#F5F5F5",
              color: rewardMultiplier === v ? "white" : "#666",
              border: "none",
            }}>{v}x</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#FFF9E6", borderRadius: 16, padding: 14, border: "2px solid #FFD700" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#FF8C00", marginBottom: 12 }}>📊 학습 현황</div>
        {[
          { label: "배운 히라가나", value: `${completedChars ? completedChars.length : 0} / ${HIRAGANA.length}`, bar: completedChars ? completedChars.length / HIRAGANA.length : 0, unit: "글자" },
          { label: "획득 포인트", value: `${points || 0}`, bar: Math.min((points || 0) / 500, 1), unit: "점" },
          { label: "획득 사탕", value: `${candies || 0}`, bar: Math.min((candies || 0) / 100, 1), unit: "개" },
        ].map(stat => (
          <div key={stat.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 4 }}>
              <span>{stat.label}</span>
              <span style={{ color: "#FF8C00" }}>{stat.value}{stat.unit}</span>
            </div>
            <div style={{ height: 10, background: "#EEE", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${Math.round(stat.bar * 100)}%`, height: "100%", background: "linear-gradient(90deg, #FF8C00, #FF6347)", borderRadius: 5, transition: "width 0.8s ease" }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {completedChars && completedChars.map(c => (
            <span key={c} style={{ background: "#FFD700", color: "#333", borderRadius: 6, padding: "2px 6px", fontSize: 14, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900 }}>{c}</span>
          ))}
        </div>
      </div>

      <button onClick={() => setParentUnlocked(false)} style={{
        width: "100%", marginTop: 14, padding: "12px", borderRadius: 14,
        background: "#333", color: "#aaa", fontSize: 13, fontWeight: 700,
        border: "2px solid #555",
      }}>🔒 학부모 모드 잠금</button>
    </div>
  );
}
