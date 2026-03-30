import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://' + window.location.hostname.replace('frontend', 'api') + '/api'; 
// Vercel 환경에서 자동으로 백엔드 주소를 찾도록 설정

function App() {
  const [todos, setTodos] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('calendar'); // 'calendar' or 'all'
  
  // 날짜 관련 상태
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // 2026년 3월 기준
  const [modal, setModal] = useState({ open: false, date: null, todo: null, text: '' });

  useEffect(() => { if (token) fetchTodos(); }, [token]);

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${API_URL}/todos`, { headers: { Authorization: token } });
      setTodos(res.data);
    } catch (err) { console.error(err); }
  };

  // --- 달력 계산 로직 ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const dateArray = Array.from({ length: lastDate }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null);

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  // --- CRUD 기능 ---
  const handleSaveTodo = async () => {
    if (!modal.text) return;
    try {
      if (modal.todo) { // 수정
        await axios.put(`${API_URL}/todos/${modal.todo._id}`, { title: modal.text });
      } else { // 추가
        await axios.post(`${API_URL}/todos`, { title: modal.text, year, month: month + 1, date: modal.date });
      }
      setModal({ open: false, date: null, todo: null, text: '' });
      fetchTodos();
    } catch (err) { alert('저장 실패'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('삭제할까요?')) return;
    await axios.delete(`${API_URL}/todos/${id}`);
    setModal({ open: false, date: null, todo: null, text: '' });
    fetchTodos();
  };

  const toggleCheck = async (todo) => {
    await axios.put(`${API_URL}/todos/${todo._id}`, { completed: !todo.completed });
    fetchTodos();
  };

  // --- 렌더링: 로그인 ---
  if (!token) return (
    <div className="auth-wrapper">
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          const res = await axios.post(`${API_URL}/login`, { username, password });
          localStorage.setItem('token', res.data.token);
          setToken(res.data.token);
        } catch { alert('로그인 실패'); }
      }} className="auth-form sketch-border">
        <h1>To-Do Login</h1>
        <div className="input-group">
          <label>ID</label>
          <input type="text" className="sketch-input" value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input type="password" className="sketch-input" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <div className="auth-buttons">
          <button type="submit" className="sketch-button">로그인</button>
          <button type="button" onClick={async () => {
            try { await axios.post(`${API_URL}/register`, { username, password }); alert('가입 성공!'); }
            catch { alert('가입 실패'); }
          }} className="sketch-button">회원가입</button>
        </div>
      </form>
    </div>
  );

  // --- 렌더링: 캘린더/목록 ---
  return (
    <div className="calendar-wrapper">
      <h1 className="main-title" style={{textAlign:'center'}}>To-Do List</h1>
      
      {view === 'calendar' ? (
        <div className="calendar-container sketch-border">
          <div className="calendar-header">
            <button className="nav-btn" onClick={()=>changeMonth(-1)}>{'<'}</button>
            <h2>{year}년 {month + 1}월</h2>
            <button className="nav-btn" onClick={()=>changeMonth(1)}>{'>'}</button>
          </div>
          <div className="calendar-grid">
            {['일','월','화','수','목','금','토'].map((d,i) => (
              <div key={d} className={`weekday ${i===0?'weekday-sun':i===6?'weekday-sat':''}`} style={{textAlign:'center', fontWeight:'bold'}}>{d}</div>
            ))}
            {emptyDays.concat(dateArray).map((d, i) => (
              <div key={i} className={`calendar-day ${i%7===0?'sun-day':i%7===6?'sat-day':''}`}>
                <span>{d}</span>
                {d && <button className="add-todo-btn" onClick={()=>setModal({open:true, date:d, todo:null, text:''})}>+</button>}
                {todos.filter(t => t.year === year && t.month === month + 1 && t.date === d).map(todo => (
                  <div key={todo._id} className="todo-item">
                    <div className={`sketch-check ${todo.completed?'checked':''}`} onClick={(e)=>{e.stopPropagation(); toggleCheck(todo);}}></div>
                    <span className={`todo-text ${todo.completed?'completed':''}`} onClick={()=>setModal({open:true, date:d, todo:todo, text:todo.title})}>
                      {todo.title}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="all-list-container sketch-border" style={{padding:'20px'}}>
          <h2>모든 할 일 (날짜 순)</h2>
          {[...todos].sort((a,b) => new Date(a.year, a.month-1, a.date) - new Date(b.year, b.month-1, b.date)).map(todo => (
            <div key={todo._id} className="todo-item" style={{justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <div className={`sketch-check ${todo.completed?'checked':''}`} onClick={()=>toggleCheck(todo)}></div>
                <span>[{todo.year}-{todo.month}-{todo.date}] {todo.title}</span>
              </div>
              <div style={{display:'flex', gap:'5px'}}>
                <button onClick={()=>setModal({open:true, date:todo.date, todo:todo, text:todo.title})}>수정</button>
                <button onClick={()=>handleDelete(todo._id)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="footer-btns">
        <button className="sketch-button" onClick={()=>setView(view==='calendar'?'all':'calendar')}>
          {view==='calendar' ? '모든 할 일 목록 보기 ▷' : '캘린더로 돌아가기'}
        </button>
        <button className="sketch-button" onClick={()=>{localStorage.removeItem('token'); setToken(null);}}>로그아웃</button>
      </div>

      {modal.open && (
        <div className="modal-overlay">
          <div className="sketch-border" style={{width:'300px', padding:'20px', display:'flex', flexDirection:'column', gap:'15px'}}>
            <h3>{modal.date}일 일정 {modal.todo?'수정':'추가'}</h3>
            <input type="text" className="sketch-input" value={modal.text} onChange={e=>setModal({...modal, text:e.target.value})} autoFocus />
            <div style={{display:'flex', gap:'10px'}}>
              <button className="sketch-button" onClick={handleSaveTodo}>저장</button>
              {modal.todo && <button className="sketch-button" style={{color:'red'}} onClick={()=>handleDelete(modal.todo._id)}>삭제</button>}
              <button className="sketch-button" onClick={()=>setModal({open:false, date:null, todo:null, text:''})}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;