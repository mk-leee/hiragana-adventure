// SJPT 대비 덩어리(Collocation) 문장 데이터
// japanese: 실제 일본어(가나/한자), hiragana: 히라가나 독음, romaji: 로마자, meaning: 한국어 뜻
const SJPT_PHRASES = [
  // ── 일상 동작 ──────────────────────────────────────
  { id: 1,  emoji: "☕", japanese: "コーヒーを飲みます",        hiragana: "こーひーを のみます",        romaji: "ko-hi- o nomimasu",          meaning: "커피를 마십니다",     category: "일상" },
  { id: 2,  emoji: "📖", japanese: "本を読みます",              hiragana: "ほんを よみます",            romaji: "hon o yomimasu",             meaning: "책을 읽습니다",       category: "일상" },
  { id: 3,  emoji: "🎵", japanese: "音楽を聴きます",            hiragana: "おんがくを ききます",        romaji: "ongaku o kikimasu",          meaning: "음악을 듣습니다",     category: "일상" },
  { id: 4,  emoji: "🍚", japanese: "ご飯を食べます",            hiragana: "ごはんを たべます",          romaji: "gohan o tabemasu",           meaning: "밥을 먹습니다",       category: "일상" },
  { id: 5,  emoji: "📷", japanese: "写真を撮ります",            hiragana: "しゃしんを とります",        romaji: "shashin o torimasu",         meaning: "사진을 찍습니다",     category: "일상" },
  { id: 6,  emoji: "🎬", japanese: "映画を見ます",              hiragana: "えいがを みます",            romaji: "eiga o mimasu",              meaning: "영화를 봅니다",       category: "일상" },
  { id: 7,  emoji: "🛍️", japanese: "買い物をします",           hiragana: "かいものを します",          romaji: "kaimono o shimasu",          meaning: "쇼핑을 합니다",       category: "일상" },
  { id: 8,  emoji: "🖥️", japanese: "パソコンで仕事をします",   hiragana: "ぱそこんで しごとを します", romaji: "pasokon de shigoto o shimasu", meaning: "컴퓨터로 일합니다", category: "일상" },

  // ── 사람·관계 ──────────────────────────────────────
  { id: 9,  emoji: "👫", japanese: "友達に会います",            hiragana: "ともだちに あいます",        romaji: "tomodachi ni aimasu",        meaning: "친구를 만납니다",     category: "관계" },
  { id: 10, emoji: "📞", japanese: "電話をかけます",            hiragana: "でんわを かけます",          romaji: "denwa o kakemasu",           meaning: "전화를 겁니다",       category: "관계" },
  { id: 11, emoji: "✉️", japanese: "メールを送ります",         hiragana: "めーるを おくります",        romaji: "me-ru o okurimasu",          meaning: "메일을 보냅니다",     category: "관계" },
  { id: 12, emoji: "🤝", japanese: "よろしくお願いします",      hiragana: "よろしく おねがいします",    romaji: "yoroshiku onegaishimasu",    meaning: "잘 부탁드립니다",     category: "인사" },
  { id: 13, emoji: "🙏", japanese: "ありがとうございます",      hiragana: "ありがとう ございます",      romaji: "arigatou gozaimasu",         meaning: "감사합니다",          category: "인사" },
  { id: 14, emoji: "🙇", japanese: "すみません",                hiragana: "すみません",                 romaji: "sumimasen",                  meaning: "실례합니다·죄송합니다", category: "인사" },
  { id: 15, emoji: "🌅", japanese: "おはようございます",        hiragana: "おはよう ございます",        romaji: "ohayou gozaimasu",           meaning: "안녕하세요(아침)",    category: "인사" },

  // ── 이동·장소 ──────────────────────────────────────
  { id: 16, emoji: "🚃", japanese: "電車に乗ります",            hiragana: "でんしゃに のります",        romaji: "densha ni norimasu",         meaning: "전철을 탑니다",       category: "이동" },
  { id: 17, emoji: "🚌", japanese: "バスを待ちます",            hiragana: "ばすを まちます",            romaji: "basu o machimasu",           meaning: "버스를 기다립니다",   category: "이동" },
  { id: 18, emoji: "🚉", japanese: "駅に行きます",              hiragana: "えきに いきます",            romaji: "eki ni ikimasu",             meaning: "역에 갑니다",         category: "이동" },
  { id: 19, emoji: "🏠", japanese: "家に帰ります",              hiragana: "いえに かえります",          romaji: "ie ni kaerimasu",            meaning: "집에 돌아갑니다",     category: "이동" },
  { id: 20, emoji: "🏨", japanese: "ホテルに泊まります",        hiragana: "ほてるに とまります",        romaji: "hoteru ni tomarimasu",       meaning: "호텔에 묵습니다",     category: "이동" },

  // ── 직장·학교 ──────────────────────────────────────
  { id: 21, emoji: "💼", japanese: "会議があります",            hiragana: "かいぎが あります",          romaji: "kaigi ga arimasu",           meaning: "회의가 있습니다",     category: "직장" },
  { id: 22, emoji: "📊", japanese: "資料を作ります",            hiragana: "しりょうを つくります",      romaji: "shiryou o tsukurimasu",      meaning: "자료를 만듭니다",     category: "직장" },
  { id: 23, emoji: "✏️", japanese: "宿題をします",             hiragana: "しゅくだいを します",        romaji: "shukudai o shimasu",         meaning: "숙제를 합니다",       category: "학교" },
  { id: 24, emoji: "🏫", japanese: "授業を受けます",            hiragana: "じゅぎょうを うけます",      romaji: "jugyou o ukemasu",           meaning: "수업을 받습니다",     category: "학교" },
  { id: 25, emoji: "🍺", japanese: "ビールを一杯飲みます",      hiragana: "びーるを いっぱい のみます", romaji: "bi-ru o ippai nomimasu",     meaning: "맥주를 한 잔 마십니다", category: "일상" },
];

export default SJPT_PHRASES;
