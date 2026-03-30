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

   // Todo 스키마
   const todoSchema = new mongoose.Schema({
     title: { type: String, required: true },
     completed: { type: Boolean, default: false }
   });
   const Todo = mongoose.model('Todo', todoSchema);

   // API 엔드포인트
   app.get('/api/todos', async (req, res) => {
     const todos = await Todo.find();
     res.json(todos);
   });

   app.post('/api/todos', async (req, res) => {
     const newTodo = new Todo({ title: req.body.title });
     await newTodo.save();
     res.json(newTodo);
   });

   app.put('/api/todos/:id', async (req, res) => {
     const todo = await Todo.findByIdAndUpdate(req.params.id, { completed: req.body.completed }, { new: true });
     res.json(todo);
   });

   app.delete('/api/todos/:id', async (req, res) => {
     await Todo.findByIdAndDelete(req.params.id);
     res.json({ message: '삭제 완료' });
   });

   const PORT = process.env.PORT || 5000;
   module.exports = app;