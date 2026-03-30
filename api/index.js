require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.log(err));

// --- 1. 데이터 스키마 설정 ---

// Todo 스키마
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  // 캘린더 기능을 위해 추가 정보 저장
  year: Number,
  month: Number,
  date: Number,
  timestamp: Number
});
const Todo = mongoose.model('Todo', todoSchema);

// User 스키마 (회원가입용)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);


// --- 2. 인증 관련 API (회원가입/로그인) ---

// 회원가입
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).json({ message: '회원가입 성공' });
  } catch (error) {
    res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    // 실제 프로젝트에서는 JWT를 써야 하지만, 우선 테스트를 위해 가짜 토큰을 보냅니다.
    res.json({ token: 'success-token-123', message: '로그인 성공' });
  } else {
    res.status(401).json({ message: '아이디 또는 비밀번호가 틀립니다.' });
  }
});


// --- 3. Todo 관련 API ---

app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

app.post('/api/todos', async (req, res) => {
  const newTodo = new Todo(req.body); // title, year, month 등 전체 데이터 저장
  await newTodo.save();
  res.json(newTodo);
});

app.put('/api/todos/:id', async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(todo);
});

app.delete('/api/todos/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: '삭제 완료' });
});

module.exports = app;