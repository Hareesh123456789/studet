const role = new URLSearchParams(window.location.search).get('role');

// Register Form
document.getElementById('registerForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: form.get('username'),
      password: form.get('password'),
      role
    })
  });
  alert(await res.text());
  if (res.ok) location.href = `login.html?role=${role}`;
});

// Login Form
document.getElementById('loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const username = form.get('username');
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: form.get('password'),
      role
    })
  });
  const result = await res.text();
  alert(result);
  if (res.ok) {
    localStorage.setItem('loggedInUser', username); // ✅ STORE USER
    location.href = `${role}-dashboard.html`;
  }
});

// Teacher Submit Form
document.getElementById('markForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  await fetch('/teacher/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(form))
  });
  alert('Data submitted');
});

// Student Dashboard: Load Data
if (window.location.pathname.endsWith('student-dashboard.html')) {
  const username = localStorage.getItem('loggedInUser');
  const output = document.getElementById('output') || document.body;

  if (!username) {
    output.innerHTML = '<p style="color:red;">You are not logged in.</p>';
  } else {
    fetch(`/student/data?username=${username}`)
      .then(res => res.json())
      .then(data => {
        let html = `<p><strong>Attendance:</strong> ${data.attendance || 'N/A'}%</p>`;
        html += `<h3>Marks:</h3><ul>`;
        data.marks.forEach(m => {
          html += `<li>${m.subject}: ${m.marks}</li>`;
        });
        html += `</ul>`;
        output.innerHTML = html;
      })
      .catch(() => {
        output.innerHTML = '<p style="color:red;">Error loading data.</p>';
      });
  }
}
