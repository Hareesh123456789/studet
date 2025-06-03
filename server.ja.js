const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('users.db');
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS marks (
    student TEXT,
    subject TEXT,
    marks INTEGER,
    FOREIGN KEY(student) REFERENCES users(username)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    student TEXT,
    percentage INTEGER,
    FOREIGN KEY(student) REFERENCES users(username)
  )`);
});

// Register route
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (row) return res.status(400).send('User already exists');
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashed, role], err => {
      if (err) return res.status(500).send('DB error');
      res.send('Registered successfully');
    });
  });
});

// Login route
app.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND role = ?', [username, role], async (err, user) => {
    if (!user) return res.status(400).send('Invalid username or role');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send('Incorrect password');
    res.send('Login successful');
  });
});

// Teacher: Submit marks and attendance
app.post('/teacher/submit', (req, res) => {
  const { student, subject, marks, attendance } = req.body;

  db.serialize(() => {
    db.run('INSERT INTO marks (student, subject, marks) VALUES (?, ?, ?)', [student, subject, marks]);
    db.run('REPLACE INTO attendance (student, percentage) VALUES (?, ?)', [student, attendance]);
  });

  res.send('Submitted');
});

// Student: Serve dashboard data (optional route for dynamic fetch)
app.get('/student/data', (req, res) => {
  const { username } = req.query;
  db.serialize(() => {
    db.all('SELECT * FROM marks WHERE student = ?', [username], (err, marks) => {
      db.get('SELECT percentage FROM attendance WHERE student = ?', [username], (err, attendance) => {
        res.json({ marks, attendance: attendance?.percentage || 'N/A' });
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
