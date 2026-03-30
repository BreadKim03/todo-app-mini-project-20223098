// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// API 주소 (Vercel 배포 주소로 변경 필요)
const API_URL = 'http://localhost:5000/api';

function App() {
  const [todos, setTodos] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // 달력 기능을 위한 상태
  const [currentMonth, setCurrentMonth] = useState('2026년 3월'); 

  useEffect(() => {
    if (token) fetchTodos();
  }, [token]);

  const fetchTodos = async () => {
    const res = await axios.get(`${API_URL}/todos`, { headers: { Authorization: token } });
    setTodos(res.data);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/register`, { username, password });
      alert('회원가입 성공!');
    } catch (err) { alert('이미 존재하는 아이디입니다.'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      fetchTodos();
    } catch (err) { alert('아이디 또는 비밀번호가 틀립니다.'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // --- 로그인/회원가입 양식 ---
  const renderAuthForm = () => (
    <form onSubmit={handleLogin} className="auth-form sketch-border">
      <h1>To-Do 로그인</h1>
      
      {/* ID/PW 세로 정렬 */}
      <div className="input-group">
        <label htmlFor="username">ID</label>
        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="sketch-input" placeholder="아이디" required />
      </div>
      
      <div className="input-group">
        <label htmlFor="password">비밀번호</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="sketch-input" placeholder="비밀번호" required />
      </div>
      
      <div className="auth-buttons">
        <button type="submit" className="sketch-button">로그인</button>
        <button type="button" onClick={handleSignup} className="sketch-button">회원가입</button>
      </div>
    </form>
  );

  // --- 캘린더 그리드 스타일의 투두 리스트 ---
  const renderTodoList = () => (
    <div className="todo-wrapper">
      <h1 className="main-title">To-Do List</h1>
      
      <div className="calendar-container sketch-border">
        {/* 달력 헤더 */}
        <div className="calendar-header">
          <button className="nav-btn">{'<'}</button>
          <h2>{currentMonth}</h2>
          <button className="nav-btn">{'>'}</button>
        </div>

        {/* 요일 */}
        <div className="calendar-weekdays">
          {['일','월','화','수','목','금','토'].map((day, i) => (
            <div key={day} className={`weekday ${i===0 ? 'weekday-sun' : i===6 ? 'weekday-sat' : ''}`}>{day}</div>
          ))}
        </div>

        {/* 날짜 그리드 (간단히 31일까지 구현) */}
        <div className="calendar-grid">
          {[...Array(31)].map((_, i) => (
            <div key={i} className={`calendar-day ${(i+1)%7===1 ? 'sun-day' : (i+1)%7===0 ? 'sat-day' : ''}`}>
              <span>{i + 1}</span>
              <button className="add-todo-btn">+</button>
            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="calendar-footer">
          <button onClick={handleLogout} className="sketch-button all-list-btn">로그아웃</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {token ? renderTodoList() : renderAuthForm()}
    </div>
  );
}

export default App;