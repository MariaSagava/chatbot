const express = require('express');
const path = require('path');
const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuração das Conexões com Múltiplos MongoDB Atlas ---
const MONGO_URI_LOGS = process.env.MONGO_URI || "mongodb+srv://user_log_acess:Log4c3ss2025@cluster0.nbt3sks.mongodb.net/IIW2023A_Logs?retryWrites=true&w=majority&appName=Cluster0";
const MONGO_URI_HISTORIA = process.env.MONGO_URI_HISTORIA || "mongodb+srv://mariaed:mariaissa130308@chatbot.cocduuo.mongodb.net/?retryWrites=true&w=majority&appName=chatbot";

let dbLogs;
let dbHistoria;

async function connectToMongoDB(uri, dbName) {
    if (!uri) {
        console.error(`URI do MongoDB para o banco '${dbName}' não foi definida nas variáveis de ambiente.`);
        return null;
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log(`✅ Conectado com sucesso ao MongoDB Atlas: ${dbName}`);
        return client.db(dbName); // Retorna a instância do banco de dados
    } catch (err) {
        console.error(`❌ Falha ao conectar ao MongoDB ${dbName}:`, err);
        return null;
    }
}

async function initializeDatabases() {
    console.log("Iniciando conexões com os bancos de dados...");
    dbLogs = await connectToMongoDB(MONGO_URI_LOGS, "IIW2023A_Logs");
    dbHistoria = await connectToMongoDB(MONGO_URI_HISTORIA, "chatbotHistoriaDB");

    if (!dbLogs || !dbHistoria) {
        console.warn("⚠️ Atenção: Uma ou mais conexões com o banco de dados falharam. A aplicação pode funcionar de forma limitada.");
    }
}


// --- Simulação de Armazenamento para Ranking (Mantido) ---
let dadosRankingVitrine = [];

// --- Middlewares ---
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.set('trust proxy', true);

// --- Rotas da Aplicação ---

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Rota de log de acesso (Usa dbLogs)
app.post('/api/log-connection', async (req, res) => {
  if (!dbLogs) {
    return res.status(503).json({ error: "Serviço de log indisponível." });
  }
  // ... (código mantido da atividade anterior, usando dbLogs)
  try {
    const { acao, nomeBot } = req.body;
    const ip = req.ip || 'IP não detectado';
    if (!acao || !nomeBot) return res.status(400).json({ error: "Dados de log incompletos." });

    const agora = new Date();
    const logEntry = {
      col_data: agora.toISOString().split('T')[0],
      col_hora: agora.toTimeString().split(' ')[0],
      col_IP: ip,
      col_nome_bot: nomeBot,
      col_acao: acao
    };

    const collection = dbLogs.collection("tb_cl_user_log_acess");
    await collection.insertOne(logEntry);
    console.log('[Servidor] Log de acesso gravado:', logEntry);
    res.status(201).json({ success: true, message: "Log registrado." });
  } catch (error) {
    console.error("Erro ao gravar log:", error);
    res.status(500).json({ error: true, message: "Erro ao registrar log." });
  }
});

// NOVO ENDPOINT: Rota para salvar o histórico do chat (Usa dbHistoria)
app.post('/api/chat/salvar-historico', async (req, res) => {
    if (!dbHistoria) {
        return res.status(503).json({ error: "Servidor não conectado ao banco de dados de histórico." });
    }
    try {
        const { sessionId, botId, startTime, endTime, messages } = req.body;

        if (!sessionId || !botId || !messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Dados incompletos para salvar histórico." });
        }

        const sessaoData = {
            userId: 'anonimo', // Pode ser expandido no futuro
            botId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            messages,
            lastUpdated: new Date()
        };

        const collection = dbHistoria.collection("sessoesChat");
        // Usa updateOne com upsert: cria se não existir, atualiza se existir.
        // Isso é perfeito para uma sessão de chat contínua.
        const result = await collection.updateOne(
            { sessionId: sessionId }, // Filtro para encontrar a sessão
            { $set: sessaoData },     // Dados para atualizar ou inserir
            { upsert: true }          // Opção para criar se não encontrar
        );
        
        const message = result.upsertedCount > 0 ? "Histórico de sessão criado." : "Histórico de sessão atualizado.";
        console.log(`[Servidor] ${message} ID: ${sessionId}`);
        res.status(201).json({ success: true, message, sessionId });

    } catch (error) {
        console.error("[Servidor] Erro em /api/chat/salvar-historico:", error.message);
        res.status(500).json({ error: "Erro interno ao salvar histórico de chat." });
    }
});


// Rotas de Ranking e Outras (Mantidas como antes)
app.post('/api/ranking/registrar-acesso-bot', (req, res) => { /* ... código mantido ... */ 
    const { botId, nomeBot } = req.body;
    if (!botId || !nomeBot) {
        return res.status(400).json({ error: "ID e Nome do Bot são obrigatórios." });
    }
    const agora = new Date();
    const botExistente = dadosRankingVitrine.find(b => b.botId === botId);
    if (botExistente) {
        botExistente.contagem++;
        botExistente.ultimoAcesso = agora;
    } else {
        dadosRankingVitrine.push({ botId, nomeBot, contagem: 1, ultimoAcesso: agora });
    }
    console.log('[Servidor] Dados de ranking atualizados:', dadosRankingVitrine);
    res.status(201).json({ message: `Acesso ao bot ${nomeBot} registrado.` });
});
app.get('/api/ranking/visualizar', (req, res) => { /* ... código mantido ... */
    const rankingOrdenado = [...dadosRankingVitrine].sort((a, b) => b.contagem - a.contagem);
    res.json(rankingOrdenado);
});
app.post('/api/weather', async (req, res) => { /* ... código mantido ... */
  try {
    const { location } = req.body;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: true, message: 'Chave não configurada no servidor.' });
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=pt_br`;
    const response = await axios.get(url);
    return res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Erro ao obter dados meteorológicos';
    return res.status(status).json({ error: true, message });
  }
});

// Iniciar o servidor após tentar conectar aos bancos de dados
initializeDatabases().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
});