// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// API 주소 자동 설정 로직
const API_URL = 'https://' + window.location.hostname.replace('frontend', 'api') + '/api'; 

function App() {
  const [todos, setTodos] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) fetchTodos();
  }, [token]);

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${API_URL}/todos`, { headers: { Authorization: token } });
      setTodos(res.data);
    } catch (err) { console.error(err); }
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

  // --- 로그인/회원가입 양식 (수정됨) ---
  const renderAuthForm = () => (
    <form onSubmit={handleLogin} className="auth-form sketch-border">
      {/* 타이틀 변경 */}
      <h1>To-Do List</h1>
      {/* 소제목 추가 */}
      <h2 className="auth-subtitle">오늘의 할 일은?</h2>
      
      <div className="input-group">
        <label htmlFor="username">ID</label>
        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="sketch-input" required />
      </div>
      
      <div className="input-group">
        <label htmlFor="password">비밀번호</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="sketch-input" required />
      </div>
      
      <div className="auth-buttons">
        <button type="submit" className="sketch-button">로그인</button>
        <button type="button" onClick={handleSignup} className="sketch-button">회원가입</button>
      </div>
    </form>
  );

  // --- 캘린더 리스트 세션 ---
  const renderTodoList = () => (
    <div className="calendar-wrapper">
      <h1 className="main-title" style={{textAlign:'center'}}>To-Do List</h1>
      
      <div className="calendar-container sketch-border">
        {/* 달력 헤더 (년/월) */}
        <div className="calendar-header" style={{display:'flex', justifyContent:'center', gap:'15px', marginBottom:'15px'}}>
          <button className="nav-btn" style={{background:'none', border:'none', fontSize:'20px'}}>{'<'}</button>
          <h2>2026년 3월</h2>
          <button className="nav-btn" style={{background:'none', border:'none', fontSize:'20px'}}>{'>'}</button>
        </div>

        {/* 요일 */}
        <div className="calendar-weekdays">
          {['일','월','화','수','목','금','토'].map((day, i) => (
            <div key={day} className={`weekday ${i===0 ? 'weekday-sun' : i===6 ? 'weekday-sat' : ''}`}>{day}</div>
          ))}
        </div>

        {/* 날짜 그리드 (31일까지 예시) */}
        <div className="calendar-grid">
          {[...Array(31)].map((_, i) => (
            <div key={i} className={`calendar-day ${(i+1)%7===1 ? 'sun-day' : (i+1)%7===0 ? 'sat-day' : ''}`}>
              <span>{i + 1}</span>
              {/* 할 일 예시 */}
              <div style={{fontSize:'12px'}}>📝 일정 추가</div>
            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="calendar-footer">
          <button onClick={handleLogout} className="sketch-button">로그아웃</button>
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