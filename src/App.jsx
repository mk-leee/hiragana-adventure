import { useState, useEffect, useRef, useCallback } from "react";
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
  return { points: 0, candies: 0, completedChars: [], owned: [], currentRoom: "🏡" };
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
// MAIN APP
// ============================================================
export default function HiraganaAdventure() {
  const [currentUserId, setCurrentUserId] = useState(null);

  const handleSelectUser = (userId) => setCurrentUserId(userId);
  const handleSwitchUser = () => setCurrentUserId(null);

  if (!currentUserId) return <UserSelectScreen onSelect={handleSelectUser} />;
  return <UserApp userId={currentUserId} onSwitchUser={handleSwitchUser} />;
}

function UserApp({ userId, onSwitchUser }) {
  const userData = loadUserData(userId);
  const userInfo = USERS.find(u => u.id === userId);

  const [screen, setScreen] = useState("home"); // home | story | quiz | fishing | balloon | shop | parent | draw
  const [points, setPoints] = useState(userData.points);
  const [candies, setCandies] = useState(userData.candies);
  const [streak, setStreak] = useState(0);
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

  // Save to localStorage whenever key data changes
  useEffect(() => {
    saveUserData(userId, { points, candies, completedChars, owned, currentRoom });
  }, [userId, points, candies, completedChars, owned, currentRoom]);

  const triggerParticles = useCallback((x = 50, y = 50) => {
    setParticlePos({ x, y });
    setParticles(true);
    setTimeout(() => setParticles(false), 100);
  }, []);

  const reward = useCallback((pts, msg, mood = "excited", x = 50, y = 50) => {
    setPoints(p => p + pts);
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
    setNotification({ text: `+${pts}포인트 🍬`, color: "#FFD700" });
    setTimeout(() => setNotification(null), 1500);
  }, [streak, triggerParticles]);

  const showScreen = (s) => {
    setScreen(s);
    setFoxMessage(
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
        <div style={{ color: "white", fontWeight: 900, fontSize: 16 }}>
          ひらがな冒険
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

      {/* STREAK BADGE */}
      {streak > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #FF69B4, #FF1493)",
          color: "white", textAlign: "center", padding: "4px",
          fontSize: 12, fontWeight: 800, letterSpacing: 1,
        }}>🔥 {streak}연속 정답! 대단해요!</div>
      )}

      <div style={{ padding: 16 }}>
        {screen === "home" && <HomeScreen showScreen={showScreen} reward={reward} completedChars={completedChars} foxDancing={foxDancing} foxMessage={foxMessage} foxMood={foxMood} setScreen={setScreen} setParentUnlocked={setParentUnlocked} />}
        {screen === "story" && <StoryScreen reward={reward} completedChars={completedChars} setCompletedChars={setCompletedChars} foxMood={foxMood} setFoxMood={setFoxMood} setFoxMessage={setFoxMessage} triggerParticles={triggerParticles} />}
        {screen === "quiz" && <QuizScreen reward={reward} triggerParticles={triggerParticles} setFoxMessage={setFoxMessage} setFoxMood={setFoxMood} />}
        {screen === "fishing" && <FishingGame reward={reward} triggerParticles={triggerParticles} />}
        {screen === "balloon" && <BalloonGame reward={reward} triggerParticles={triggerParticles} />}
        {screen === "shop" && <ShopScreen points={points} setPoints={setPoints} owned={owned} setOwned={setOwned} setCurrentRoom={setCurrentRoom} />}
        {screen === "draw" && <DrawScreen reward={reward} triggerParticles={triggerParticles} />}
        {screen === "parent" && <ParentScreen parentUnlocked={parentUnlocked} setParentUnlocked={setParentUnlocked} parentPin={parentPin} setParentPin={setParentPin} wrongPin={wrongPin} setWrongPin={setWrongPin} />}
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
    </div>
  );
}

// ============================================================
// HOME SCREEN
// ============================================================
function HomeScreen({ showScreen, reward, completedChars, foxDancing, foxMessage, foxMood, setScreen }) {
  const progress = (completedChars.length / HIRAGANA.length) * 100;

  const menus = [
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

      {/* MENU GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {menus.map(m => (
          <button key={m.id} onClick={() => showScreen(m.id)} style={{
            background: m.bg,
            border: `3px solid ${m.color}`,
            borderRadius: 20, padding: "18px 12px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: `0 4px 14px ${m.color}40`,
            animation: "slide-up 0.5s ease both",
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          onTouchStart={e => e.currentTarget.style.transform = "scale(0.95)"}
          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <span style={{ fontSize: 36 }}>{m.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: m.color }}>{m.label}</span>
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
  const [charIndex, setCharIndex] = useState(0);
  const [lessonStep, setLessonStep] = useState(0); // 0:chapter list  1:learn  2:quiz  3:complete
  const [quizResult, setQuizResult] = useState(null);

  const lessonChar = currentChapter ? currentChapter.chars[charIndex] : null;

  const goNextChar = useCallback(() => {
    setQuizResult(null);
    if (charIndex + 1 < currentChapter.chars.length) {
      setCharIndex(i => i + 1);
      setLessonStep(1);
    } else {
      setLessonStep(3); // chapter complete
    }
  }, [charIndex, currentChapter]);

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
          <button onClick={() => setLessonStep(2)} style={{
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
    const choices = [char.rom, ...HIRAGANA.filter(h => h.char !== lessonChar).sort(() => Math.random()-0.5).slice(0,3).map(h => h.rom)]
      .sort(() => Math.random()-0.5);
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
              if (quizResult) return;
              if (c === char.rom) {
                setQuizResult("correct");
                if (!completedChars.includes(char.char)) {
                  setCompletedChars(prev => [...prev, char.char]);
                }
                reward(15, `${PRAISE[Math.floor(Math.random()*PRAISE.length)]} 맞았어!`, "excited");
                setTimeout(() => goNextChar(), 1200);
              } else {
                setQuizResult("wrong");
                setTimeout(() => setQuizResult(null), 1000);
              }
            }} style={{
              padding: "20px 10px",
              borderRadius: 16,
              fontSize: 20, fontWeight: 900,
              background: quizResult === "correct" && c === char.rom ? "#4CAF50" :
                          quizResult === "wrong"   && c !== char.rom ? "#FF5252" :
                          "white",
              color: quizResult === "correct" && c === char.rom ? "white" :
                     quizResult === "wrong"   && c !== char.rom ? "white" : "#333",
              border: "3px solid #FFD700",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transition: "all 0.2s",
            }}>{c}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#FF8C00", marginBottom: 12, textAlign: "center" }}>
        📖 히라코와 일본 여행 — 챕터 선택
      </div>
      {CHAPTERS.map((ch, i) => (
        <button key={i} onClick={() => {
          if (!ch.unlocked && i > 0) return;
          setCurrentChapter(ch);
          setCharIndex(0);
          setLessonStep(1);
        }} style={{
          width: "100%", marginBottom: 10,
          background: ch.unlocked ? "linear-gradient(135deg, #FFF9E6, #FFF3CC)" : "#EEE",
          border: ch.unlocked ? "3px solid #FFD700" : "3px solid #CCC",
          borderRadius: 16, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          opacity: ch.unlocked || i === 0 ? 1 : 0.5,
          boxShadow: ch.unlocked ? "0 4px 12px rgba(255,215,0,0.3)" : "none",
        }}>
          <div style={{ fontSize: 32 }}>{ch.unlocked || i===0 ? "🗺️" : "🔒"}</div>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: ch.unlocked||i===0 ? "#FF8C00" : "#999" }}>
              Week {ch.week}: {ch.title}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {ch.chars.join(" · ")}
            </div>
          </div>
          <div style={{ fontSize: 18 }}>{ch.unlocked || i===0 ? "▶" : "🔒"}</div>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// QUIZ SCREEN
// ============================================================
function QuizScreen({ reward, triggerParticles, setFoxMessage, setFoxMood }) {
  const [current, setCurrent] = useState(() => HIRAGANA[Math.floor(Math.random()*10)]);
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [shake, setShake] = useState(false);

  const makeChoices = useCallback((correct) => {
    const others = HIRAGANA.filter(h => h.char !== correct.char)
      .sort(() => Math.random()-0.5).slice(0,3);
    return [correct, ...others].sort(() => Math.random()-0.5);
  }, []);

  useEffect(() => {
    setChoices(makeChoices(current));
  }, [current, makeChoices]);

  const next = useCallback(() => {
    const next = HIRAGANA[Math.floor(Math.random() * 46)];
    setCurrent(next);
    setChoices(makeChoices(next));
    setSelected(null);
  }, [makeChoices]);

  const pick = (c) => {
    if (selected) return;
    setSelected(c);
    setTotal(t => t + 1);
    if (c.char === current.char) {
      setScore(s => s + 1);
      reward(10, PRAISE[Math.floor(Math.random()*PRAISE.length)] + " 정답!", "excited");
      setTimeout(next, 1000);
    } else {
      setShake(true);
      setFoxMessage(`정답은 「${current.char}」= ${current.rom} 이야!`);
      setFoxMood("thinking");
      setTimeout(() => { setShake(false); next(); }, 1500);
    }
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
      {selected && (
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
function FishingGame({ reward, triggerParticles }) {
  const [fish, setFish] = useState(() => Array.from({length:6}, (_,i) => ({
    id: i, char: HIRAGANA[Math.floor(Math.random()*10)],
    x: Math.random()*70+5, y: Math.random()*40+30, speed: Math.random()*0.5+0.3,
    dir: Math.random()>0.5?1:-1,
  })));
  const [target, setTarget] = useState(() => HIRAGANA[Math.floor(Math.random()*10)]);
  const [caught, setCaught] = useState([]);
  const [miss, setMiss] = useState(0);
  const animRef = useRef();

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

  const catchFish = (f) => {
    if (f.char.char === target.char) {
      setCaught(prev => [...prev, f.char.char]);
      setFish(prev => {
        const filtered = prev.filter(x => x.id !== f.id);
        return [...filtered, {
          id: Date.now(), char: HIRAGANA[Math.floor(Math.random()*20)],
          x: Math.random()*70+5, y: Math.random()*40+30,
          speed: Math.random()*0.5+0.3, dir: Math.random()>0.5?1:-1,
        }];
      });
      reward(20, `「${target.char}」 낚았어! 잘했어!`, "excited");
      setTarget(HIRAGANA[Math.floor(Math.random()*46)]);
    } else {
      setMiss(m => m + 1);
      triggerParticles(f.x, f.y);
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
        <div style={{ fontSize: 13, color: "#888" }}>= {target.rom}</div>
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
              fontSize: 16, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900,
              color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
            }}>{f.char.char}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2196F3" }}>✅ 잡은 것: {caught.length}마리</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#FF5252" }}>❌ 실수: {miss}번</div>
      </div>
    </div>
  );
}

// ============================================================
// BALLOON GAME
// ============================================================
function BalloonGame({ reward, triggerParticles }) {
  const [balloons, setBalloons] = useState(() => Array.from({length:6}, (_,i) => ({
    id: i,
    char: HIRAGANA[Math.floor(Math.random()*20)],
    x: Math.random()*80+5, y: 80 + Math.random()*10,
    speed: Math.random()*0.3+0.15,
    color: ["#FF69B4","#FF8C00","#4CAF50","#2196F3","#9C27B0","#FF5722"][i%6],
  })));
  const [target, setTarget] = useState(() => HIRAGANA[Math.floor(Math.random()*20)]);
  const [score, setScore] = useState(0);
  const animRef = useRef();

  useEffect(() => {
    const move = () => {
      setBalloons(prev => prev.map(b => {
        const ny = b.y - b.speed * 0.3;
        if (ny < -15) {
          return { ...b, y: 90, x: Math.random()*80+5, char: HIRAGANA[Math.floor(Math.random()*46)] };
        }
        return { ...b, y: ny };
      }));
      animRef.current = requestAnimationFrame(move);
    };
    animRef.current = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const pop = (b, e) => {
    if (b.char.char === target.char) {
      setBalloons(prev => prev.map(x => x.id === b.id
        ? { ...x, y: 90, x: Math.random()*80+5, char: HIRAGANA[Math.floor(Math.random()*46)] }
        : x
      ));
      reward(15, "빵! 맞췄어! 🎉", "excited");
      setScore(s => s + 1);
      setTarget(HIRAGANA[Math.floor(Math.random()*46)]);
    } else {
      triggerParticles(b.x, b.y);
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
        <div style={{ fontSize: 13, color: "#888" }}>= {target.rom}</div>
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
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center",
            fontSize: 44,
          }}>
            <span style={{ display: "block", lineHeight: 1 }}>🎈</span>
            <span style={{
              position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
              fontSize: 15, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 900,
              color: b.color, textShadow: "0 1px 3px white",
            }}>{b.char.char}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 10, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#9C27B0" }}>
        터트린 풍선: {score}개 🎈
      </div>
    </div>
  );
}

// ============================================================
// DRAW SCREEN
// ============================================================
function DrawScreen({ reward, triggerParticles }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [target] = useState(HIRAGANA[Math.floor(Math.random()*10)]);
  const [done, setDone] = useState(false);
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
  };

  const endDraw = (e) => {
    e.preventDefault();
    setDrawing(false);
  };

  const check = () => {
    setDone(true);
    reward(20, `잘 썼어! 「${target.char}」 완벽해!`, "excited");
    triggerParticles(50, 30);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDone(false);
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
        <button onClick={check} style={{
          flex: 2, padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 800,
          background: "linear-gradient(135deg, #4CAF50, #8BC34A)", color: "white",
          border: "none", boxShadow: "0 4px 12px rgba(76,175,80,0.4)",
          animation: "pulse 2s infinite",
        }}>✅ 완료! 별 받기 ⭐</button>
      </div>
      {done && (
        <div style={{ textAlign: "center", marginTop: 16, animation: "bounce-in 0.5s ease" }}>
          <div style={{ fontSize: 40 }}>🎉⭐🌟⭐🎉</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#4CAF50" }}>훌륭해요! +20포인트!</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SHOP SCREEN
// ============================================================
function ShopScreen({ points, setPoints, owned, setOwned, setCurrentRoom }) {
  const [tab, setTab] = useState("sticker");
  const [bought, setBought] = useState(null);
  const tabs = [
    { id: "sticker", label: "스티커", icon: "🌟" },
    { id: "avatar", label: "아바타", icon: "🦊" },
    { id: "room", label: "방꾸미기", icon: "🏠" },
  ];
  const filtered = SHOP_ITEMS.filter(i => i.type === tab);

  const buy = (item) => {
    if (owned.includes(item.id)) return;
    if (points < item.price) { setBought("fail"); setTimeout(() => setBought(null), 1000); return; }
    setPoints(p => p - item.price);
    setOwned(prev => [...prev, item.id]);
    if (item.type === "room") setCurrentRoom(item.emoji);
    setBought(item.id);
    setTimeout(() => setBought(null), 1200);
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
function ParentScreen({ parentUnlocked, setParentUnlocked, parentPin, setParentPin, wrongPin, setWrongPin }) {
  const REAL_PIN = "1234";
  const [difficulty, setDifficulty] = useState("normal");
  const [dailyLimit, setDailyLimit] = useState(30);
  const [rewardMultiplier, setRewardMultiplier] = useState(1);

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
        <div style={{ fontSize: 14, fontWeight: 800, color: "#FF8C00", marginBottom: 8 }}>📊 이번 주 학습 현황</div>
        {["월","화","수","목","금","토","일"].map((d, i) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, width: 20, color: "#888" }}>{d}</span>
            <div style={{ flex: 1, height: 10, background: "#EEE", borderRadius: 5, overflow: "hidden" }}>
              <div style={{
                width: `${[80,45,90,30,0,0,0][i]}%`, height: "100%",
                background: "linear-gradient(90deg, #FF8C00, #FF6347)", borderRadius: 5,
              }}/>
            </div>
            <span style={{ fontSize: 10, color: "#888", width: 35 }}>{[24,14,27,9,0,0,0][i]}분</span>
          </div>
        ))}
      </div>

      <button onClick={() => setParentUnlocked(false)} style={{
        width: "100%", marginTop: 14, padding: "12px", borderRadius: 14,
        background: "#333", color: "#aaa", fontSize: 13, fontWeight: 700,
        border: "2px solid #555",
      }}>🔒 학부모 모드 잠금</button>
    </div>
  );
}
