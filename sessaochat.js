// --- Elementos do DOM para o Histórico ---
const loadHistoryButton = document.getElementById("load-history-button");
const historySection = document.getElementById("historico-container");
const historyListContainer = document.getElementById("lista-sessoes");
const conversationDetailContainer = document.getElementById("visualizacao-conversa-detalhada");

/**
 * Cria e retorna um elemento de mensagem formatado, reutilizando os estilos do chat principal.
 * @param {string} text - O conteúdo da mensagem.
 * @param {string} sender - 'user' ou 'bot'.
 * @returns {HTMLElement} O elemento da mensagem.
 */
function createMessageElement(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    
    // Aplica a mesma formatação de Markdown e LaTeX do chat principal
    let processedText = text.replace(/</g, "<").replace(/>/g, ">");
    if (sender === 'bot') {
        processedText = processedText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\$\$(.*?)\$\$/g, '<div class="physics-formula">$1</div>')
            .replace(/\$(.*?)\$/g, '<span class="formula">$1</span>')
            .replace(/\n/g, '<br>');
    }

    // Usa a mesma estrutura de avatar e header do chat principal
    const avatarChar = sender === 'user' ? 'U' : 'PG';
    const senderName = sender === 'user' ? 'Você' : 'PhysicsGenius';

    messageElement.innerHTML = `
        <div class="message-header">
            <div class="avatar">${avatarChar}</div>
            <span>${senderName}</span>
        </div>
        <div class="message-content">${processedText}</div>`;
        
    return messageElement;
}

/**
 * Renderiza uma conversa completa no contêiner de visualização de detalhes.
 * @param {object} sessao - O objeto completo da sessão, contendo o array 'messages'.
 */
function exibirConversaDetalhada(sessao) {
    conversationDetailContainer.innerHTML = ''; // Limpa a visualização anterior

    const FIM_CONVERSA_FORMATADO = new Date(sessao.endTime).toLocaleString('pt-BR');
    const header = document.createElement('h3');
    header.innerHTML = `Conversa de ${FIM_CONVERSA_FORMATADO} <button id="close-history-view" title="Fechar Visualização">X</button>`;
    conversationDetailContainer.appendChild(header);

    // Adiciona o listener para fechar a visualização detalhada
    document.getElementById('close-history-view').addEventListener('click', () => {
        conversationDetailContainer.style.display = 'none';
        conversationDetailContainer.innerHTML = '';
    });

    if (sessao.messages && Array.isArray(sessao.messages)) {
        sessao.messages.forEach(message => {
            const sender = message.role === 'model' ? 'bot' : 'user';
            const text = message.parts[0]?.text || '[Mensagem vazia]';
            const messageEl = createMessageElement(text, sender);
            conversationDetailContainer.appendChild(messageEl);
        });
    }

    conversationDetailContainer.style.display = 'block';
    conversationDetailContainer.scrollTop = conversationDetailContainer.scrollHeight;
}

/**
 * Busca os históricos de sessão do backend e popula a lista na UI.
 */
async function carregarHistoricoSessoes() {
    if (!historyListContainer) return;
    historyListContainer.innerHTML = '<li>Carregando históricos...</li>';

    try {
        const response = await fetch('/api/chat/historicos');
        if (!response.ok) {
            throw new Error(`Falha ao buscar históricos: ${response.statusText}`);
        }
        const sessoes = await response.json();
        
        historyListContainer.innerHTML = ''; // Limpa o "Carregando..."

        if (sessoes.length === 0) {
            historyListContainer.innerHTML = '<li>Nenhum histórico encontrado.</li>';
            return;
        }

        sessoes.forEach(sessao => {
            const listItem = document.createElement('li');
            listItem.classList.add('sessao-item');
            const dataFormatada = new Date(sessao.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const msgCount = sessao.messages ? sessao.messages.length : 0;
            listItem.textContent = `Conversa de ${dataFormatada} (${msgCount} msgs)`;
            
            listItem.addEventListener('click', () => exibirConversaDetalhada(sessao));
            
            historyListContainer.appendChild(listItem);
        });

    } catch (error) {
        console.error("Erro ao carregar históricos:", error);
        historyListContainer.innerHTML = '<li>Ocorreu um erro ao carregar os históricos.</li>';
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    if (loadHistoryButton && historySection) {
        let historyLoaded = false;
        loadHistoryButton.addEventListener('click', () => {
            const isHidden = historySection.style.display === 'none';
            
            if (isHidden) {
                historySection.style.display = 'block';
                // Carrega o histórico apenas na primeira vez que o usuário abre a seção
                if (!historyLoaded) {
                    carregarHistoricoSessoes();
                    historyLoaded = true;
                }
            } else {
                historySection.style.display = 'none';
                conversationDetailContainer.style.display = 'none'; // Esconde a view detalhada também
            }
        });
    }
});