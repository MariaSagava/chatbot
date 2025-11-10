const inputUserId = document.getElementById('user-id');
const textarea = document.getElementById('custom-instruction');
const saveBtn = document.getElementById('save-btn');
const msgSpan = document.getElementById('msg');

async function carregarPreferencia() {
    const userId = inputUserId.value || localStorage.getItem('userId');
    if (!userId) return;
    try {
        const res = await fetch('/api/user/preferences', {
            headers: { 'x-user-id': userId }
        });
        if (!res.ok) throw new Error('Falha ao carregar preferências');
        const data = await res.json();
        textarea.value = data.customSystemInstruction || '';
        localStorage.setItem('userId', userId);
        msgSpan.textContent = '';
    } catch (err) {
        console.error('Erro ao carregar preferência:', err);
        msgSpan.style.color = 'red';
        msgSpan.textContent = 'Erro ao carregar.';
    }
}

inputUserId.addEventListener('change', carregarPreferencia);
inputUserId.addEventListener('blur', carregarPreferencia);

saveBtn.addEventListener('click', async () => {
    const userId = inputUserId.value || localStorage.getItem('userId');
    if (!userId) {
        msgSpan.style.color = 'red';
        msgSpan.textContent = 'Informe seu userId.';
        return;
    }
    const payload = { customSystemInstruction: textarea.value };
    try {
        const res = await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Erro ao salvar');
        msgSpan.style.color = 'green';
        msgSpan.textContent = 'Salvo com sucesso.';
        localStorage.setItem('userId', userId);
    } catch (err) {
        console.error('Erro ao salvar preferência:', err);
        msgSpan.style.color = 'red';
        msgSpan.textContent = 'Erro ao salvar.';
    }
});
