import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// --- API URL 설정 최적화 ---
const getApiUrl = () => {
  if (window.location.hostname === 'localhost') return 'http://localhost:5000/api';
  return 'https://' + window.location.hostname.replace('frontend', 'api') + '/api';
};
const API_URL = getApiUrl();

function App() {
  const [todos, setTodos] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // 2026년 3월 시작
  const [modal, setModal] = useState({ open: false, date: null, todo: null, text: '' });

  useEffect(() => { if (token) fetchTodos(); }, [token]);

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${API_URL}/todos`);
      setTodos(res.data);
    } catch (err) { console.error("데이터 로드 실패:", err); }
  };

  // 날짜 계산 로직
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const dateArray = Array.from({ length: lastDate }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null);

  const handleSave = async () => {
    if (!modal.text) return;
    try {
      if (modal.todo) {
        await axios.put(`${API_URL}/todos/${modal.todo._id}`, { title: modal.text });
      } else {
        await axios.post(`${API_URL}/todos`, { title: modal.text, year, month: month + 1, date: modal.date });
      }
      setModal({ open: false, date: null, todo: null, text: '' });
      fetchTodos();
    } catch (err) { alert('저장 중 오류 발생'); }
  };

  const toggleCheck = async (todo) => {
    try {
      await axios.put(`${API_URL}/todos/${todo._id}`, { completed: !todo.completed });
      fetchTodos();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm('이 일정을 삭제할까요?')) {
      await axios.delete(`${API_URL}/todos/${id}`);
      setModal({ open: false, date: null, todo: null, text: '' });
      fetchTodos();
    }
  };

  // 로그인/회원가입 화면
  if (!token) return (
    <div className="app-container">
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          const res = await axios.post(`${API_URL}/login`, { username, password });
          localStorage.setItem('token', res.data.token);
          setToken(res.data.token);
        } catch { alert('로그인 정보를 확인해주세요.'); }
      }} className="auth-form sketch-border">
        <h1>To-Do List</h1>
        <h2 className="auth-subtitle">오늘의 할 일은?</h2>
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
            try {
              await axios.post(`${API_URL}/register`, { username, password });
              alert('회원가입이 완료되었습니다!');
            } catch { alert('아이디가 중복되었거나 가입에 실패했습니다.'); }
          }} className="sketch-button">회원가입</button>
        </div>
      </form>
    </div>
  );

  // 캘린더 및 전체 목록 화면
  return (
    <div className="app-container">
      <div className="calendar-wrapper">
        <h1 className="main-title" style={{textAlign:'center', fontSize:'36px', marginBottom:'30px'}}>To-Do List</h1>
        
        {view === 'calendar' ? (
          <div className="calendar-container sketch-border">
            <div className="calendar-header" style={{display:'flex', justifyContent:'center', gap:'30px', marginBottom:'30px'}}>
              <button className="nav-btn" style={{fontSize:'30px', background:'none', border:'none', cursor:'pointer'}} onClick={()=>setCurrentDate(new Date(year, month-1, 1))}>{'<'}</button>
              <h2 style={{fontSize:'32px'}}>{year}년 {month + 1}월</h2>
              <button className="nav-btn" style={{fontSize:'30px', background:'none', border:'none', cursor:'pointer'}} onClick={()=>setCurrentDate(new Date(year, month+1, 1))}>{'>'}</button>
            </div>
            
            <div className="calendar-grid">
              {['일','월','화','수','목','금','토'].map((d,i)=>(
                <div key={d} className={`weekday ${i===0?'sun-day':i===6?'sat-day':''}`} style={{textAlign:'center', fontWeight:'bold', fontSize:'20px', paddingBottom:'10px'}}>{d}</div>
              ))}
              {emptyDays.concat(dateArray).map((d, i) => (
                <div key={i} className={`calendar-day ${i%7===0?'sun-day':i%7===6?'sat-day':''}`}>
                  <span style={{fontSize:'18px', fontWeight:'bold'}}>{d}</span>
                  {d && <button className="add-todo-btn" style={{position:'absolute', top:'5px', right:'5px', background:'none', border:'1px solid #ddd', cursor:'pointer'}} onClick={()=>setModal({open:true, date:d, todo:null, text:''})}>+</button>}
                  <div style={{marginTop:'10px'}}>
                    {todos.filter(t => t.year===year && t.month===month+1 && t.date===d).map(todo => (
                      <div key={todo._id} className="todo-item" onClick={()=>setModal({open:true, date:d, todo:todo, text:todo.title})}>
                        <div className={`sketch-check ${todo.completed?'checked':''}`} onClick={(e)=>{e.stopPropagation(); toggleCheck(todo);}}></div>
                        <span className={todo.completed?'completed':''}>{todo.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="sketch-border" style={{width:'100%', padding:'30px', minHeight:'500px'}}>
            <h2 style={{fontSize:'28px', marginBottom:'20px'}}>모든 일정 (날짜 순)</h2>
            {[...todos].sort((a,b)=>new Date(a.year, a.month-1, a.date)-new Date(b.year, b.month-1, b.date)).map(todo=>(
              <div key={todo._id} className="todo-item" style={{justifyContent:'space-between', padding:'15px', borderBottom:'2px solid #eee'}}>
                <div style={{display:'flex', gap:'15px', alignItems:'center', fontSize:'20px'}}>
                  <div className={`sketch-check ${todo.completed?'checked':''}`} style={{width:'22px', height:'22px'}} onClick={()=>toggleCheck(todo)}></div>
                  <span>[{todo.year}-{todo.month}-{todo.date}] {todo.title}</span>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                  <button className="sketch-button" style={{padding:'5px 15px'}} onClick={()=>setModal({open:true, date:todo.date, todo:todo, text:todo.title})}>수정</button>
                  <button className="sketch-button" style={{padding:'5px 15px', color:'red'}} onClick={()=>handleDelete(todo._id)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="footer-btns" style={{marginTop:'30px', display:'flex', justifyContent:'space-between', width:'100%'}}>
          <button className="sketch-button" style={{padding:'15px 30px', fontSize:'22px'}} onClick={()=>setView(view==='calendar'?'all':'calendar')}>
            {view==='calendar' ? '모든 할 일 목록 보기 ▷' : '캘린더로 돌아가기'}
          </button>
          <button className="sketch-button" style={{padding:'15px 30px', fontSize:'22px'}} onClick={()=>{localStorage.removeItem('token'); setToken(null);}}>로그아웃</button>
        </div>
      </div>

      {modal.open && (
        <div className="modal-overlay">
          <div className="sketch-border" style={{width:'400px', padding:'30px', display:'flex', flexDirection:'column', gap:'20px', background:'#fff'}}>
            <h3 style={{fontSize:'24px'}}>{modal.date}일 일정 {modal.todo?'수정':'추가'}</h3>
            <input type="text" className="sketch-input" value={modal.text} onChange={e=>setModal({...modal, text:e.target.value})} autoFocus placeholder="할 일을 입력하세요..." />
            <div style={{display:'flex', gap:'10px'}}>
              <button className="sketch-button" style={{flex:2}} onClick={handleSave}>저장</button>
              <button className="sketch-button" style={{flex:1}} onClick={()=>setModal({open:false, date:null, todo:null, text:''})}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;