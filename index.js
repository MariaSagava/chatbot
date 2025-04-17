import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Elementos do DOM (ajustados para bater com o HTML)
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Configuração da API
const API_KEY = "AIzaSyCq6BRjupNXHgvC0OK5i_hYj-_3rQ796XQ";
const genAI = new GoogleGenerativeAI(API_KEY);

// Instrução do sistema
const systemInstruction = `
Aja como um mestre em Física, com profundo conhecimento em todas as áreas da disciplina, incluindo mecânica clássica, termodinâmica, eletromagnetismo, óptica, física moderna (relatividade e mecânica quântica), física de partículas, astrofísica e física computacional.

Você deve ser capaz de:
• Explicar conceitos de forma clara e acessível, adaptando a linguagem para diferentes níveis de conhecimento (ensino fundamental, médio, técnico ou universitário);
• Resolver problemas passo a passo, com justificativas teóricas e matemáticas;
• Criar exemplos e analogias que facilitem a compreensão;
• Contextualizar historicamente os principais marcos da física e seus cientistas;
• Sugerir experimentos práticos simples e avançados;
• Relacionar a Física com outras áreas, como Química, Matemática, Engenharia e Filosofia da Ciência;
• Atualizar-se com descobertas recentes e aplicações tecnológicas modernas.

Aja com precisão, profundidade e didática. Você é um guia completo no universo da Física.
`;

let isWaitingForResponse = false;

async function sendMessage(userInput) {
    showTypingIndicator();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat();

    try {
        const result = await chat.sendMessage(systemInstruction + "\nUsuário: " + userInput);
        const text = await result.response.text();
        removeTypingIndicator();
        addMessageToUI(text, 'bot');
    } catch (err) {
        removeTypingIndicator();
        addMessageToUI(`Erro: ${err.message}`, 'bot');
        console.error(err);
    }

    isWaitingForResponse = false;
}

function addMessageToUI(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

    let processedText = text;
    if (sender === 'bot') {
        processedText = processedText.split('\n\n').map(p => `<p>${p}</p>`).join('');
    }

    messageElement.innerHTML = `
        <div class="message-header ${sender}">
            <div class="avatar">${sender === 'user' ? 'Você' : 'PG'}</div>
            <span>${sender === 'user' ? 'Você' : 'PhysicsGenius'}</span>
        </div>
        ${processedText}
        <span class="message-time">${getCurrentTime()}</span>
    `;

    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function showTypingIndicator() {
    typingIndicator.style.display = 'block';
    scrollToBottom();
}

function removeTypingIndicator() {
    typingIndicator.style.display = 'none';
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function handleUserMessage() {
    if (isWaitingForResponse) return;

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    addMessageToUI(userMessage, 'user');
    messageInput.value = '';
    sendButton.disabled = true;
    messageInput.focus();
    isWaitingForResponse = true;
    sendMessage(userMessage);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    messageInput.addEventListener('input', () => {
        sendButton.disabled = messageInput.value.trim().length === 0;
    });

    sendButton.addEventListener('click', handleUserMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUserMessage();
        }
    });

    // Inicializar o botão como desativado
    sendButton.disabled = true;
});
