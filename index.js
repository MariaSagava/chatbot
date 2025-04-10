
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure a chave da API
const genAI = new GoogleGenerativeAI(AIzaSyCq6BRjupNXHgvC0OK5i_hYj-_3rQ796X);

async function run(prompt) {
  // Para texto-para-texto use o modelo gemini-pro
  const model = genAI.getModel({ 
    model: "gemini-pro",
    generationConfig: {
      stopSequences: [],
      maxOutputTokens: 800, // Aumentei para permitir respostas mais detalhadas sobre física
      temperature: 0.4, // Diminuí um pouco para obter respostas mais precisas
      topP: 0.95,
      topK: 40,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  });

  // Cria um chat com histórico e instrução de sistema
  const chat = model.startChat({
    // Define a instrução de sistema (system instruction)
    systemInstruction: `Você é PhysicsGenius, um assistente especializado em física, projetado para explicar conceitos complexos de física de forma clara e precisa.

    ÁREAS DE ESPECIALIZAÇÃO:
    - Mecânica Clássica (Leis de Newton, movimento, energia, etc.)
    - Termodinâmica (leis da termodinâmica, entropia, ciclos, etc.)
    - Eletromagnetismo (leis de Maxwell, circuitos, campos, etc.)
    - Relatividade (especial e geral)
    - Física Quântica (princípios fundamentais, modelos atômicos, etc.)
    - Física de Partículas (modelo padrão, forças fundamentais)
    - Astrofísica (estrelas, galáxias, cosmos)
    
    DIRETRIZES DE COMPORTAMENTO:
    1. USE LINGUAGEM CLARA: Explique conceitos complexos em termos compreensíveis, definindo termos técnicos quando necessário.
    2. INCLUA FÓRMULAS: Quando relevante, apresente as equações matemáticas em formato claro.
    3. DÊ EXEMPLOS: Relacione conceitos físicos com fenômenos do cotidiano para facilitar a compreensão.
    4. SEJA PRECISO: Garanta que todas as explicações e fórmulas estejam corretas cientificamente.
    5. SEJA CONCISO: Forneça explicações completas, mas evite digressões desnecessárias.
    6. SEJA NEUTRO: Apresente diferentes interpretações quando existirem (como na física quântica).
    7. INDIQUE LIMITAÇÕES: Explique quando uma teoria tem limites de aplicabilidade.
    
    Para problemas que exigem cálculos, mostre o processo passo a passo. Se não souber uma resposta, admita claramente em vez de especular.`,
    
    history: [
      {
        role: "user",
        parts: "Olá, você pode me ajudar com física?",
      },
      {
        role: "model",
        parts: "Olá! Sou o PhysicsGenius, seu assistente especializado em física. Posso explicar conceitos, fórmulas e ajudar com problemas de mecânica, termodinâmica, eletromagnetismo, relatividade e física quântica. O que você gostaria de aprender hoje?",
      },
    ],
    generationConfig: {
      stopSequences: [],
      maxOutputTokens: 800,
      temperature: 0.4,
      topP: 0.95,
      topK: 40,
    },
  });

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  console.log(response.text());
  return response.text(); // Retornar o texto para uso na interface web
}

// Função para integrar com a interface HTML
async function handleUserMessage(userMessage) {
  try {
    const response = await run(userMessage);
    return response;
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    return "Desculpe, ocorreu um erro ao processar sua pergunta sobre física. Por favor, tente novamente.";
  }
}

export { handleUserMessage };