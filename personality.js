const inputUserId = document.getElementById('user-id');
const textarea = document.getElementById('custom-instruction');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const msgSpan = document.getElementById('msg');
const currentText = document.getElementById('current-instruction-text');

// Carregar userId salvo e preferências ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
        inputUserId.value = savedUserId;
        carregarPreferencia();
    }
});

// Carregar preferência ao mudar o userId
inputUserId.addEventListener('change', () => {
    if (inputUserId.value.trim()) {
        localStorage.setItem('userId', inputUserId.value);
        carregarPreferencia();
    }
});

inputUserId.addEventListener('blur', () => {
    if (inputUserId.value.trim()) {
        localStorage.setItem('userId', inputUserId.value);
        carregarPreferencia();
    }
});

async function carregarPreferencia() {
    const userId = inputUserId.value.trim();
    if (!userId) {
        msgSpan.textContent = '';
        msgSpan.className = 'feedback';
        currentText.textContent = '';
        return;
    }

    try {
        msgSpan.textContent = 'Carregando...';
        msgSpan.className = 'feedback';

        const res = await fetch('/api/user/preferences', {
            headers: { 'x-user-id': userId }
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('Usuário não autenticado');
            }
            throw new Error(`Erro HTTP ${res.status}`);
        }

        const data = await res.json();
        const instruction = data.customSystemInstruction || '';
        textarea.value = instruction;
        currentText.textContent = instruction || '(Nenhuma personalidade customizada definida)';
        msgSpan.textContent = '';
        msgSpan.className = 'feedback';
    } catch (err) {
        console.error('Erro ao carregar preferência:', err);
        msgSpan.textContent = `❌ Erro ao carregar: ${err.message}`;
        msgSpan.className = 'feedback error';
        currentText.textContent = '';
    }
}

saveBtn.addEventListener('click', async () => {
    const userId = inputUserId.value.trim();
    if (!userId) {
        msgSpan.textContent = '❌ Informe seu userId';
        msgSpan.className = 'feedback error';
        inputUserId.focus();
        return;
    }

    const instruction = textarea.value;

    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Salvando...';

    try {
        const res = await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify({ customSystemInstruction: instruction })
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('Usuário não autenticado');
            }
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Erro HTTP ${res.status}`);
        }

        localStorage.setItem('userId', userId);
        currentText.textContent = instruction || '(Nenhuma personalidade customizada definida)';
        msgSpan.textContent = '✅ Personalidade salva com sucesso!';
        msgSpan.className = 'feedback success';

        // Limpar mensagem após 3 segundos
        setTimeout(() => {
            msgSpan.textContent = '';
            msgSpan.className = 'feedback';
        }, 3000);
    } catch (err) {
        console.error('Erro ao salvar preferência:', err);
        msgSpan.textContent = `❌ Erro ao salvar: ${err.message}`;
        msgSpan.className = 'feedback error';
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Salvar Personalidade';
    }
});

clearBtn.addEventListener('click', () => {
    if (confirm('Deseja limpar a personalidade customizada?')) {
        textarea.value = '';
        saveBtn.click();
    }
});
