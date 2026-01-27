const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true }
});

const QuizSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    questions: [QuestionSchema],
    config: {
        mode: { type: String, default: 'general' },
        difficulty: { type: String, default: 'medium' },
        questionCount: { type: Number, default: 10 },
        timeLimit: { type: Number, default: 15 }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);
