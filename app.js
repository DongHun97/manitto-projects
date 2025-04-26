const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TEAMS = {
  '예능1팀': ["정현아", "강연우", "강예은", "김소윤", "김준하", "박형준", "윤은선"],
  '예능2팀': ["박지호", "이현영", "이지민", "김예은", "이정우", "김소윤"],
  '뮤비1팀': ["박세영", "곽찬샘", "장혜림", "홍성진", "김늘", "김미정", "고은비"],
  '뮤비2팀': ["강동훈", "김서현", "방새영", "문소희", "송호석", "고채완"],
  '광고팀': ["김민지", "김건호", "안다은", "우예나", "홍채은"],
  '다큐팀': ["김찬영", "김혜원", "이지아", "김유주", "전시은", "김준민"],
  '고독한미식가팀': ["김예슬", "김예림", "양희용", "황지상", "임채율", "변은서", "임여진", "김준규"]
};

const teamSchema = new mongoose.Schema({
  team: String,
  name: String,
  passwordHash: String,
  assigned: String
});
const aliasSchema = new mongoose.Schema({
  team: String,
  name: String,
  alias: String
});

const Team = mongoose.model('Team', teamSchema);
const Alias = mongoose.model('Alias', aliasSchema);

async function generateAlias(team, name) {
  const alias = "ID-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  await Alias.create({ team, name, alias });
  return alias;
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

app.post('/register', async (req, res) => {
  const { team, name, password } = req.body;
  const members = TEAMS[team];

  if (!members || !members.includes(name)) {
    return res.status(400).json({ error: '유효하지 않은 팀 또는 이름입니다.' });
  }

  const exist = await Team.find({ team });
  if (exist.length === 0) {
    let assigned;
    do {
      assigned = shuffle([...members]);
    } while (members.some((v, i) => v === assigned[i]));
    

    for (let i = 0; i < members.length; i++) {
      const pwhash = members[i] === name ? await bcrypt.hash(password, 10) : null;
      await Team.create({ team, name: members[i], passwordHash: pwhash, assigned: assigned[i] });
      await generateAlias(team, assigned[i]);
    }
  } else {
    const user = await Team.findOne({ team, name });
    if (user.passwordHash) {
      return res.status(400).json({ error: '이미 등록되었습니다.' });
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
  }
  res.json({ success: true });
});

app.post('/check', async (req, res) => {
  const { team, name, password } = req.body;
  const user = await Team.findOne({ team, name });
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });

  res.json({ assigned: user.assigned });
});

app.post('/admin/view', async (req, res) => {
  const { id, password, reveal } = req.body;
  if (id !== 'arthur0079' || password !== 'editor0079') {
    return res.status(403).json({ error: '관리자 인증 실패' });
  }

  const result = {};
  for (const team in TEAMS) {
    result[team] = {};
    for (const name of TEAMS[team]) {
      const user = await Team.findOne({ team, name });
      if (user) {
        if (reveal) {
          result[team][name] = user.assigned;
        } else {
          const alias = await Alias.findOne({ team, name: user.assigned });
          result[team][name] = alias ? alias.alias : '(미배정)';
        }
      } else {
        result[team][name] = '(미배정)';
      }
    }
  }
  res.json({ success: true, data: result });
});

app.post('/admin/reset', async (req, res) => {
  const { id, password } = req.body;
  if (id !== 'arthur0079' || password !== 'editor0079') {
    return res.status(403).json({ error: '관리자 인증 실패' });
  }

  await Team.deleteMany({});
  await Alias.deleteMany({});
  res.json({ success: true, message: '전체 초기화 완료' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`✅ MongoDB 연결 성공! 서버 실행 중: http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 실패:', err);
  });
