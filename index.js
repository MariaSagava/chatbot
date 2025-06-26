import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Elementos do DOM
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Configuração da API
const genAI = new GoogleGenerativeAI(API_KEY);

// --- Variáveis de Sessão e Histórico ---
let chatHistory = [];
let isWaitingForResponse = false;
// Gera um ID único para a sessão de chat ao carregar a página
const currentSessionId = `sessao_${Date.now()}_${Math.random().toString(36).substring(7)}`;
const chatStartTime = new Date();
const BOT_ID = "PhysicsGenius_v1";


// --- Funções de Logging, Ranking e Histórico ---

// Função para registrar o primeiro acesso (mantida)
async function registrarConexaoUsuario() { /* ... código mantido da atividade anterior ... */ 
    try {
        const logData = { acao: "acesso_inicial_chatbot", nomeBot: "PhysicsGenius" };
        const response = await fetch('/api/log-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        });
        if (!response.ok) console.error("Falha ao registrar log:", await response.text());
        else console.log("Log de conexão registrado.");
    } catch (error) {
        console.error("Erro de rede ao registrar log:", error);
    }
}

// Função para registrar acesso para ranking (mantida)
async function registrarAcessoBotParaRanking() { /* ... código mantido da atividade anterior ... */ 
    try {
        const dataRanking = { botId: BOT_ID, nomeBot: "PhysicsGenius" };
        const response = await fetch('/api/ranking/registrar-acesso-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataRanking)
        });
        if (!response.ok) console.error("Falha ao registrar para ranking:", await response.text());
        else console.log("Registro de ranking enviado.");
    } catch (error) {
        console.error("Erro de rede ao registrar para ranking:", error);
    }
}

// NOVA FUNÇÃO: Envia o histórico completo da sessão para o backend
async function salvarHistoricoSessao(messages) {
    try {
        const payload = {
            sessionId: currentSessionId,
            botId: BOT_ID,
            startTime: chatStartTime.toISOString(),
            endTime: new Date().toISOString(), // O fim é sempre o momento atual da interação
            messages: messages // O array chatHistory completo
        };
        const response = await fetch('/api/chat/salvar-historico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            console.error("Falha ao salvar histórico:", await response.text());
        } else {
            const result = await response.json();
            console.log("Histórico de sessão enviado:", result.message);
        }
    } catch (error) {
        console.error("Erro de rede ao enviar histórico de sessão:", error);
    }
}


// --- Lógica Principal do Chat ---
// (sendMessage foi atualizada para chamar salvarHistoricoSessao)

async function sendMessage(userInput) {
  // ... (código de UI e setup da chamada)
  if (isWaitingForResponse) return;
  isWaitingForResponse = true;
  sendButton.disabled = true;
  addMessageToUI(userInput, 'user');
  messageInput.value = '';
  showTypingIndicator();

  // Adiciona a mensagem do usuário ao histórico ANTES de enviar
  chatHistory.push({ role: "user", parts: [{ text: userInput }] });

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" /*, tools: tools */ }); // Adicionar tools se usar
  const chat = model.startChat({ history: chatHistory.slice(0, -1) }); // Envia o histórico sem a última pergunta

  try {
    const result = await chat.sendMessage(userInput);
    const text = result.response.text();
    
    // Adiciona a resposta do modelo ao histórico
    chatHistory.push({ role: "model", parts: [{ text }] });
    
    // Mostra a resposta na UI
    addMessageToUI(text, 'bot');
    
    // *** ATUALIZAÇÃO PRINCIPAL: Salva o histórico completo após a interação ***
    await salvarHistoricoSessao(chatHistory);

  } catch (err) {
    console.error("Erro ao processar mensagem:", err);
    addMessageToUI(`Ocorreu um erro: ${err.message}`, 'bot');
  } finally {
    removeTypingIndicator();
    isWaitingForResponse = false;
    sendButton.disabled = messageInput.value.trim().length === 0;
  }
}

// ... (Restante das funções de UI e helpers sem alterações significativas)
// addMessageToUI, showTypingIndicator, handleUserMessage, etc.

function addMessageToUI(text, sender) { /* ...código mantido... */ 
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
  let processedText = text.replace(/</g, "<").replace(/>/g, ">");

  if (sender === 'bot') {
    processedText = processedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\$\$(.*?)\$\$/g, '<div class="physics-formula">$1</div>')
      .replace(/\$(.*?)\$/g, '<span class="formula">$1</span>')
      .replace(/\n/g, '<br>');
  }

  messageElement.innerHTML = `
    <div class="message-header ${sender}">
      <div class="avatar">${sender === 'user' ? 'U' : 'PG'}</div>
      <span>${sender === 'user' ? 'Você' : 'PhysicsGenius'}</span>
    </div>
    <div class="message-content">${processedText}</div>`;
  chatMessages.appendChild(messageElement);
  scrollToBottom();
}
function showTypingIndicator() { typingIndicator.style.display = 'flex'; scrollToBottom(); }
function removeTypingIndicator() { typingIndicator.style.display = 'none'; }
function scrollToBottom() { chatMessages.scrollTop = chatMessages.scrollHeight; }
function handleUserMessage() {
  const userMessage = messageInput.value.trim();
  if (userMessage) sendMessage(userMessage);
}


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Chamadas iniciais
    registrarConexaoUsuario();
    registrarAcessoBotParaRanking();

    addMessageToUI("Olá! Sou o PhysicsGenius, seu assistente especialista em Física. Todas as nossas conversas agora são arquivadas para análise e melhorias futuras. Como posso ajudar?", 'bot');
    
    sendButton.addEventListener('click', handleUserMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isWaitingForResponse) {
            e.preventDefault();
            handleUserMessage();
        }
    });
    // ... outros listeners
    document.querySelectorAll('.topic-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const topic = chip.getAttribute('data-topic');
            messageInput.value = `Me explique sobre ${topic} de forma simples`;
            sendButton.disabled = false;
            messageInput.focus();
        });
    });
    messageInput.addEventListener('input', () => {
      sendButton.disabled = messageInput.value.trim().length === 0 || isWaitingForResponse;
    });
    sendButton.disabled = true;
});