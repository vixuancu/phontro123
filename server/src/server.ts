import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

const server = createServer(app);
const io = new Server(server, {
    transports: ['websocket'],
    cors: {
        credentials: true,
    }
});

// Make io globally available
declare global {
    var io: Server;
}
global.io = io;

// CORS configuration
app.use(cors({ 
    origin: process.env.CLIENT_URL, 
    credentials: true 
}));

// Import modules
import connectDB from './config/ConnectDB';
const routes = require('./routes/index');
const { verifyToken } = require('./services/tokenSevices');
const modelMessager = require('./models/Messager.model');
const { askQuestion } = require('./utils/Chatbot/chatbot');
const { AiSearch } = require('./utils/AISearch/AISearch');
const socketServices = require('./services/socketServices');

// Middleware
app.use(express.static(path.join(__dirname, '../src')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add io to request object
app.use((req: any, res, next) => {
    req.io = io;
    next();
});

// Initialize routes
routes(app);

// Connect to database
connectDB();

// Socket connection
global.io.on('connect', socketServices.connection);

// Chat endpoint
app.post('/chat', async (req, res) => {
    const { question } = req.body;
    const data = await askQuestion(question);
    return res.status(200).json(data);
});

// AI Search endpoint
app.get('/ai-search', async (req, res) => {
    const { question } = req.query;
    console.log('question', question);
    const data = await AiSearch(question);
    return res.status(200).json(data);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

// Hot search functionality (temporary array - should be moved to database)
const hotSearch: Array<{ title: string; count: number }> = [];

app.post('/api/add-search', (req, res) => {
    const { title } = req.body;
    const index = hotSearch.findIndex((item) => item.title === title);
    if (index !== -1) {
        hotSearch[index].count++;
    } else {
        hotSearch.push({ title, count: 1 });
    }
    return res.status(200).json({ message: 'Thêm từ khóa thành công' });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});