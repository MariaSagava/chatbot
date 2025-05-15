const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rota para servir o arquivo HTML principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para obter dados meteorológicos
app.post('/api/weather', async (req, res) => {
  try {
    const { location } = req.body;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: true, 
        message: 'OpenWeather API key não configurada',
        simulatedData: {
          location: location,
          temperature: "22°C",
          description: "Parcialmente nublado"
        }
      });
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=pt_br`;
    const response = await axios.get(url);
    
    return res.json({
      location: response.data.name,
      country: response.data.sys.country,
      temperature: response.data.main.temp,
      feels_like: response.data.main.feels_like,
      humidity: response.data.main.humidity,
      description: response.data.weather[0].description,
      wind: response.data.wind.speed
    });
  } catch (error) {
    console.error('Erro ao obter dados meteorológicos:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: true, 
      message: error.response?.data?.message || 'Não foi possível obter dados meteorológicos' 
    });
  }
});

// Rota para obter a data/hora atual
app.get('/api/time', (req, res) => {
  const now = new Date();
  
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  };
  
  res.json({ 
    currentTime: now.toLocaleString(),
    formattedDateTime: now.toLocaleDateString('pt-BR', options)
  });
});

// Rota para processar mensagens e interagir com a API Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Aqui você implementaria a lógica para chamar a API Gemini
    // Como o client.js já faz isso diretamente, esta rota pode ser opcional
    // ou usada para processamentos adicionais no servidor
    
    res.json({ success: true, message: 'Mensagem processada' });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});