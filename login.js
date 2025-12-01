const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const msgDiv = document.getElementById('msg');

async function doLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) {
    msgDiv.textContent = 'Informe usuário e senha.';
    msgDiv.style.color = 'red';
    return;
  }
  try {
    msgDiv.textContent = 'Entrando...';
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao autenticar');
    // armazenar token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userId', data.userId);
    msgDiv.style.color = 'green';
    msgDiv.textContent = 'Login efetuado! Você será redirecionado...';
    setTimeout(()=>{ window.location.href = '/'; }, 800);
  } catch (err) {
    msgDiv.style.color = 'red';
    msgDiv.textContent = err.message;
  }
}

async function doRegister() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) {
    msgDiv.textContent = 'Informe usuário e senha.';
    msgDiv.style.color = 'red';
    return;
  }
  try {
    msgDiv.textContent = 'Registrando...';
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar');
    msgDiv.style.color = 'green';
    msgDiv.textContent = 'Registrado com sucesso! Agora faça login.';
  } catch (err) {
    msgDiv.style.color = 'red';
    msgDiv.textContent = err.message;
  }
}

loginBtn.addEventListener('click', doLogin);
registerBtn.addEventListener('click', doRegister);
