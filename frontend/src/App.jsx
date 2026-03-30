import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 

// 환경에 따라 API 주소 설정
const API_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authView, setAuthView] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [todos, setTodos] = useState([]);
  const [view, setView] = useState('calendar');

  // 인증 헤더를 포함한 axios 인스턴스
  const authAxios = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // --- 🎯 [CRUD 1] GET: Todo 목록 불러오기 ---
  useEffect(() => {
    if (token) fetchTodos();
  }, [token, currentDate]);

  const fetchTodos = async () => {
    try {
      const response = await authAxios.get('/todos');
      setTodos(response.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) handleLogout();
    }
  };

  // --- 🎯 [CRUD 2] POST: Todo 항목 추가 ---
  const handleAddTodo = async (day) => {
    const taskTitle = prompt(`${currentDate.getMonth() + 1}월 ${day}일에 추가할 할 일을 입력하세요:`);
    if (taskTitle && taskTitle.trim() !== '') {
      try {
        await authAxios.post('/todos', {
          title: taskTitle.trim(), // 가이드의 스키마에 맞춰 'title' 사용
          completed: false,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth(),
          date: day,
          timestamp: new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getTime()
        });
        fetchTodos(); // 추가 후 새로고침
      } catch (e) {
        console.error(e);
        alert('추가 중 오류가 발생했습니다.');
      }
    }
  };

  // --- 🎯 [CRUD 3] PUT: 완료 체크 토글 ---
  const handleToggleComplete = async (todo, e) => {
    e.stopPropagation(); // 캘린더 클릭 이벤트 방지
    try {
      await authAxios.put(`/todos/${todo._id}`, {
        completed: !todo.completed 
      });
      fetchTodos(); // 상태 변경 후 새로고침
    } catch (e) {
      console.error(e);
    }
  };

  // --- 🎯 [CRUD 4] DELETE: Todo 삭제 (+ 수정 기능 포함) ---
  const handleTodoAction = async (todo) => {
    const action = prompt(`[ ${todo.title} ]\n수정하시려면 '1', 삭제하시려면 '2'를 입력하세요.`, '1');
    
    if (action === '1') {
      const newTitle = prompt('새로운 내용을 입력하세요:', todo.title);
      if (newTitle && newTitle.trim() !== '') {
        await authAxios.put(`/todos/${todo._id}`, { title: newTitle.trim() });
        fetchTodos();
      }
    } else if (action === '2') {
      if (window.confirm('정말로 삭제하시겠습니까?')) {
        try {
          await authAxios.delete(`/todos/${todo._id}`);
          fetchTodos(); // 삭제 후 새로고침
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // --- (회원가입/로그인 핸들러 및 캘린더 로직은 이전과 동일) ---
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authView === 'register') {
        await axios.post(`${API_URL}/register`, { username, password });
        alert('회원가입 완료! 이제 로그인해주세요.');
        setAuthView('login');
      } else {
        const response = await axios.post(`${API_URL}/login`, { username, password });
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
      }
    } catch (error) {
      alert(error.response?.data?.message || '오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setTodos([]);
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const emptyDays = Array.from({ length: firstDayIndex });
  const days = Array.from({ length: lastDay }, (_, i) => i + 1);

  if (!token) {
    return (
      <div className="flex flex-col items-center">
        <h1>To-Do List</h1>
        <h2>오늘의 할 일은?</h2>
        <div className="auth-form-wrapper">
          <form onSubmit={handleAuth} className="flex flex-col gap-4 w-full">
            <input type="text" placeholder="아이디" value={username} onChange={e => setUsername(e.target.value)} required className="input-field" />
            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" />
            <button type="submit" className="action-btn">{authView === 'login' ? '로그인 하기' : '가입 완료하기'}</button>
          </form>
          <button onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')} className="auth-switch-btn">
            {authView === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between w-[95%] max-w-[1200px] items-center">
        <h1 className="my-5">To-Do List</h1>
        <button className="action-btn w-auto text-[1.2rem] py-1 px-4" onClick={handleLogout}>로그아웃</button>
      </div>

      <div className="container">
        {view === 'calendar' ? (
          <div className="calendar-wrapper">
            <div className="header-area flex justify-center gap-10 items-center">
              <button className="nav-arrow" onClick={() => changeMonth(-1)}>◁</button>
              <span className="text-2xl">{year}년 {month + 1}월</span>
              <button className="nav-arrow" onClick={() => changeMonth(1)}>▷</button>
            </div>
            <div className="weekdays grid grid-cols-7 text-center mt-5">
              <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
            </div>
            <div className="days-grid grid grid-cols-7 gap-2 mt-2">
              {emptyDays.map((_, i) => <div key={`empty-${i}`} className="day-box empty bg-gray-50"></div>)}
              {days.map(day => (
                <div key={day} className="day-box border p-2 min-h-[100px] relative">
                  <span className="day-number">{day}</span>
                  {todos
                    .filter(t => t.year === year && t.month === month && t.date === day)
                    .map(todo => (
                      <div key={todo._id} className={`todo-badge ${todo.completed ? 'completed' : ''} flex items-center gap-1 mb-1 p-1 border rounded`} onClick={() => handleTodoAction(todo)}>
                        <input type="checkbox" className="todo-checkbox" checked={todo.completed || false} onChange={(e) => handleToggleComplete(todo, e)} onClick={(e) => e.stopPropagation()} />
                        <span className="todo-text text-sm truncate">{todo.title}</span>
                      </div>
                    ))}
                  <button className="add-btn absolute bottom-1 right-1 text-xl" onClick={() => handleAddTodo(day)}>+</button>
                </div>
              ))}
            </div>
            <div className="text-right mt-5">
              <button className="action-btn w-auto" onClick={() => setView('list')}>전체 목록 ▷</button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            <h3 className="text-xl mb-4">전체 To-Do 목록</h3>
            <div className="flex flex-col gap-2">
              {todos.sort((a, b) => a.timestamp - b.timestamp).map(todo => (
                <div key={todo._id} className={`list-item ${todo.completed ? 'completed' : ''} flex items-center gap-3 p-3 border rounded`} onClick={() => handleTodoAction(todo)}>
                  <input type="checkbox" className="todo-checkbox" checked={todo.completed || false} onChange={(e) => handleToggleComplete(todo, e)} onClick={(e) => e.stopPropagation()} />
                  <span>{todo.year}.{todo.month + 1}.{todo.date}.</span>
                  <span className="todo-text flex-1">{todo.title}</span>
                </div>
              ))}
            </div>
            <button className="action-btn w-auto mt-5" onClick={() => setView('calendar')}>◁ 캘린더 보기</button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;