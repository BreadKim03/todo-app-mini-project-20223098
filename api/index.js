require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. 데이터베이스 연결 관리 (서버리스 최적화) ---
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return; // 이미 연결되어 있다면 재사용

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5초 안에 연결 안 되면 에러 발생
    });
    isConnected = db.connections[0].readyState;
    console.log('MongoDB 연결 성공');
  } catch (err) {
    console.error('MongoDB 연결 실패:', err);
    throw err;
  }
};

// --- 2. 데이터 스키마 및 모델 정의 ---

// Todo 스키마 (캘린더 연동 필드 포함)
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  year: Number,
  month: Number,
  date: Number,
  timestamp: Number
});

// User 스키마 (회원가입/로그인용)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// 모델 중복 정의 방지 (Vercel 필수 설정)
const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);


// --- 3. API 엔드포인트 ---

// [회원가입]
app.post('/api/register', async (req, res) => {
  try {
    await connectDB();
    const { username, password } = req.body;
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).json({ message: '회원가입 성공' });
  } catch (error) {
    res.status(400).json({ message: '이미 존재하는 아이디이거나 오류가 발생했습니다.' });
  }
});

// [로그인]
app.post('/api/login', async (req, res) => {
  try {
    await connectDB();
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    
    if (user) {
      res.json({ token: 'success-token-123', message: '로그인 성공' });
    } else {
      res.status(401).json({ message: '아이디 또는 비밀번호가 틀립니다.' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
  }
});

// [Todo 목록 가져오기]
app.get('/api/todos', async (req, res) => {
  try {
    await connectDB();
    const todos = await Todo.find();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: '데이터를 가져오지 못했습니다.' });
  }
});

// [Todo 추가]
app.post('/api/todos', async (req, res) => {
  try {
    await connectDB();
    const newTodo = new Todo(req.body);
    await newTodo.save();
    res.json(newTodo);
  } catch (error) {
    res.status(400).json({ message: '추가 실패' });
  }
});

// [Todo 수정 (완료 체크 포함)]
app.put('/api/todos/:id', async (req, res) => {
  try {
    await connectDB();
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(todo);
  } catch (error) {
    res.status(400).json({ message: '수정 실패' });
  }
});

// [Todo 삭제]
app.delete('/api/todos/:id', async (req, res) => {
  try {
    await connectDB();
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: '삭제 완료' });
  } catch (error) {
    res.status(400).json({ message: '삭제 실패' });
  }
});

// Vercel 서버리스 익스포트
module.exports = app;