import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Elementos do DOM (ajustados para bater com o HTML)
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Configuração da API
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

Além disso, você pode usar ferramentas especiais:
• Quando o usuário perguntar sobre a data ou hora atual (ex: "que dia é hoje?", "que horas são?"), use a ferramenta getCurrentTime para obter informações precisas e atualizadas de data e hora.
• Quando o usuário perguntar sobre o clima ou tempo meteorológico em alguma cidade (ex: "como está o tempo em Curitiba?"), use a ferramenta getWeather para buscar informações atuais.

Utilize essas ferramentas sempre que necessário para responder de forma precisa às perguntas do usuário, especialmente quando se tratarem de informações em tempo real como data, hora ou clima.

Aja com precisão, profundidade e didática. Você é um guia completo no universo da Física.
A data atual é ${getCurrentTime()}, utilize em caso de precisão
`;

function getCurrentTime() {
    const date = Date()
    return date
}

// Armazenamento do histórico de mensagens
let chatHistory = [];
let isWaitingForResponse = false;

// Definição das ferramentas que o modelo pode usar
const tools = [
  {
    functionDeclarations: [
      {
        name: "getCurrentTime",
        description: "Obtém a data e hora atuais, incluindo dia da semana, dia do mês, mês, ano e horário. Use quando o usuário perguntar que dia é hoje, que horas são, qual a data atual ou perguntas similares sobre data e hora.",
        parameters: { 
          type: "object", 
          properties: {} // Sem parâmetros necessários
        }
      },
      {
        name: "getWeather",
        description: "Obtém a previsão do tempo atual para uma cidade específica.",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "A cidade para a qual obter a previsão do tempo (ex: 'Curitiba, BR')."
            }
          },
          required: ["location"]
        }
      }
    ]
  }
];

// Implementação das funções


async function getWeather(args) {
  console.log("Executando getWeather com args:", args);
  const location = args.location;
  
  // Verificar se temos a API key para OpenWeather
  // Nota: Esta chave deve estar definida no arquivo config.js
  const apiKey = OPENWEATHER_API_KEY; 
  if (!apiKey) {
    return { 
      error: "Chave da API OpenWeatherMap não configurada. Este é apenas um exemplo simulado.",
      simulatedData: {
        location: location,
        temperature: "22°C",
        description: "Parcialmente nublado"
      }
    };
  }
  
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=pt_br`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      return {
        location: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        wind: data.wind.speed
      };
    } else {
      return { 
        error: data.message || "Erro ao obter dados meteorológicos",
        errorCode: data.cod
      };
    }
  } catch (error) {
    console.error("Erro ao chamar OpenWeatherMap:", error);
    return { 
      error: "Não foi possível conectar ao serviço de previsão do tempo."
    };
  }
}

async function processToolCalls(toolCalls) {
  // Processa todas as chamadas de ferramentas e retorna os resultados
  const toolResults = [];
  
  for (const toolCall of toolCalls) {
    const functionCall = toolCall.functionCall;
    const functionName = functionCall.name;
    
    console.log(`Processando chamada de ferramenta: ${functionName}`);
    
    try {
      let args = {};
      if (functionCall.args) {
        args = JSON.parse(functionCall.args);
      }
      
      let result;
      if (functionName === "getCurrentTime") {
        result = getCurrentTime();
      } else if (functionName === "getWeather") {
        result = await getWeather(args);
      } else {
        result = { error: `Função desconhecida: ${functionName}` };
      }
      
      toolResults.push({
        toolCallId: toolCall.id,
        output: JSON.stringify(result)
      });
      
    } catch (error) {
      console.error(`Erro ao executar ${functionName}:`, error);
      toolResults.push({
        toolCallId: toolCall.id,
        output: JSON.stringify({ error: error.message })
      });
    }
  }
  
  return toolResults;
}

async function sendMessage(userInput) {
  showTypingIndicator();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // Ou use "gemini-pro" se 1.5-flash não estiver disponível
    tools: tools // Passa as ferramentas para o modelo
  });
  
  // Inicializa o chat com o histórico existente
  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  });

  try {
    // Adiciona a mensagem do usuário ao histórico
    chatHistory.push({
      role: "user",
      parts: [{ text: userInput }]
    });
    
    // Envia a mensagem para a API com o sistema de instrução
    let response = await chat.sendMessage(systemInstruction + "\nUsuário: " + userInput);
    let result = await response.response;
    
    // Verifica se há chamadas de ferramentas (function calls)
    if (result.candidates[0].content.parts[0].functionCall || 
        (result.candidates[0].content.parts[0].toolCalls && 
         result.candidates[0].content.parts[0].toolCalls.length > 0)) {
      
      console.log("Solicitação de ferramenta detectada");
      
      // Extrai as chamadas de ferramentas
      const toolCalls = result.candidates[0].content.parts[0].toolCalls || 
                        [{ id: "1", functionCall: result.candidates[0].content.parts[0].functionCall }];
      
      // Executa as ferramentas solicitadas
      const toolResults = await processToolCalls(toolCalls);
      
      // Envia os resultados de volta para o modelo
      response = await chat.sendMessage({
        role: "function",
        parts: [{ toolResults: toolResults }]
      });
      
      result = await response.response;
    }
    
    const text = result.text();
    
    // Adiciona a resposta do modelo ao histórico
    chatHistory.push({
      role: "model",
      parts: [{ text: text }]
    });
    
    removeTypingIndicator();
    addMessageToUI(text, 'bot');
    
    // Log do histórico para depuração (pode ser removido em produção)
    console.log("Histórico atual:", chatHistory);
    
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
    // Processa quebras de linha para parágrafos HTML
    processedText = processedText.split('\n\n').map(p => `<p>${p}</p>`).join('');
    
    // Identificar e estilizar fórmulas (textos entre $ ou $$)
    processedText = processedText.replace(/\$\$(.*?)\$\$/g, '<div class="physics-formula">$1</div>');
    processedText = processedText.replace(/\$(.*?)\$/g, '<span class="formula">$1</span>');
  }

  messageElement.innerHTML = `
    <div class="message-header ${sender}">
      <div class="avatar">${sender === 'user' ? 'Você' : 'PG'}</div>
      <span>${sender === 'user' ? 'Você' : 'PhysicsGenius'}</span>
    </div>
    ${processedText}
    <span class="message-time">${getCurrentTimeForUI()}</span>
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

function getCurrentTimeForUI() {
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

// Função para limpar o histórico (opcional - pode ser adicionada a um botão na UI)
function clearHistory() {
  chatHistory = [];
  console.log("Histórico limpo");
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

  // Adiciona event listeners para os chips de tópicos
  document.querySelectorAll('.topic-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const topic = chip.getAttribute('data-topic');
      messageInput.value = `Me explique sobre ${topic} de forma simples`;
      sendButton.disabled = false;
    });
  });

  // Inicializar o botão como desativado
  sendButton.disabled = true;
});