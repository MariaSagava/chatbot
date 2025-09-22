// Script para criar usuário admin com senha hash
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI_HISTORIA || "mongodb+srv://mariaed:mariaissa130308@chatbot.cocduuo.mongodb.net/?retryWrites=true&w=majority&appName=chatbot";
const DB_NAME = 'chatbotHistoriaDB';
const ADMIN_USERS_COLLECTION = 'adminUsers';

async function createAdminUser(username, password) {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(ADMIN_USERS_COLLECTION);
        const passwordHash = await bcrypt.hash(password, 10);
        await collection.insertOne({ username, passwordHash });
        console.log('Usuário admin criado com sucesso!');
    } catch (err) {
        console.error('Erro ao criar admin:', err);
    } finally {
        await client.close();
    }
}

// Edite aqui o usuário e senha desejados
createAdminUser('admin', 'senhaSuperSecreta');
