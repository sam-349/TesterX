const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const { generateQuiz } = require('./gemini');
const Quiz = require('./models/Quiz');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Helper to generate a unique 6-character room ID
const generateRoomId = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const exists = await Quiz.findOne({ roomId: result });
    return exists ? generateRoomId() : result;
};

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Helper to delete uploaded files
const deleteFile = (path) => {
    fs.unlink(path, (err) => {
        if (err) console.error("Error deleting file:", err);
    });
};

// API: Generate Quiz from Text Prompt
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, mode, difficulty, questionCount, timeLimit } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        const questions = await generateQuiz(prompt, { mode, difficulty, questionCount });
        const roomId = await generateRoomId();

        const quiz = new Quiz({
            roomId,
            questions,
            config: { mode, difficulty, questionCount, timeLimit }
        });

        await quiz.save();
        res.json({ success: true, data: quiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to generate quiz" });
    }
});

// API: Generate Quiz from Document Upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "File is required" });

    try {
        const { mode, difficulty, questionCount, timeLimit } = req.body;
        const dataBuffer = fs.readFileSync(req.file.path);

        let text = "";
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdf(dataBuffer);
            text = data.text;
        } else {
            text = dataBuffer.toString();
        }

        const maxLength = 20000;
        if (text.length > maxLength) text = text.substring(0, maxLength);

        const questions = await generateQuiz(text, { mode, difficulty, questionCount });
        const roomId = await generateRoomId();

        const quiz = new Quiz({
            roomId,
            questions,
            config: { mode, difficulty, questionCount, timeLimit: parseInt(timeLimit) }
        });

        await quiz.save();
        deleteFile(req.file.path);
        res.json({ success: true, data: quiz });

    } catch (error) {
        console.error(error);
        deleteFile(req.file.path);
        res.status(500).json({ success: false, error: "Failed to process document" });
    }
});

// API: Get Quiz by Room ID
app.post('/api/quiz/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const quiz = await Quiz.findOne({ roomId: roomId.toUpperCase() });

        if (!quiz) {
            return res.status(404).json({ success: false, error: "Quiz not found" });
        }

        res.json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// API: Update Entire Quiz (Questions/Config)
app.put('/api/quiz/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { questions, config } = req.body;

        const quiz = await Quiz.findOneAndUpdate(
            { roomId: roomId.toUpperCase() },
            { questions, config },
            { new: true }
        );

        if (!quiz) return res.status(404).json({ success: false, error: "Quiz not found" });

        res.json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to update quiz" });
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
