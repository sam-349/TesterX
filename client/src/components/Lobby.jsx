import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Layout, Play, Users, Clock, ArrowLeft, CheckCircle2, Copy, Check, Share2, Edit2, Trash2, Plus, Save, X } from 'lucide-react';

const Lobby = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [quizData, setQuizData] = useState(location.state?.quiz || null);
    const [loading, setLoading] = useState(!quizData && roomId);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // Index of question being edited
    const [editBuffer, setEditBuffer] = useState(null);

    useEffect(() => {
        if (!quizData && roomId) {
            fetchQuiz();
        }
    }, [roomId]);

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/quiz/${roomId}`, {
                method: 'POST'
            });
            const result = await response.json();
            if (result.success) {
                setQuizData(result.data);
            } else {
                setError(result.error || "Quiz not found");
            }
        } catch (err) {
            setError("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const saveToBackend = async (updatedData) => {
        try {
            await fetch(`http://localhost:3000/api/quiz/${roomId || updatedData.roomId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
        } catch (err) {
            console.error("Failed to sync changes to server:", err);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/join/${roomId || quizData?.roomId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const startEdit = (index) => {
        setIsEditing(index);
        setEditBuffer({ ...quizData.questions[index] });
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setEditBuffer(null);
    };

    const saveEdit = (index) => {
        const newQuestions = [...quizData.questions];
        newQuestions[index] = editBuffer;
        const updatedData = { ...quizData, questions: newQuestions };
        setQuizData(updatedData);
        saveToBackend(updatedData);
        setIsEditing(null);
        setEditBuffer(null);
    };

    const deleteQuestion = (index) => {
        if (!window.confirm("Delete this question?")) return;
        const newQuestions = quizData.questions.filter((_, i) => i !== index);
        const updatedData = { ...quizData, questions: newQuestions };
        setQuizData(updatedData);
        saveToBackend(updatedData);
    };

    const addQuestion = () => {
        const newQuestion = {
            question: "New Question Text",
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctAnswer: "Option 1"
        };
        const updatedData = { ...quizData, questions: [...quizData.questions, newQuestion] };
        setQuizData(updatedData);
        saveToBackend(updatedData);
        startEdit(updatedData.questions.length - 1);
    };

    const handleEditChange = (field, value) => {
        setEditBuffer(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (idx, value) => {
        const newOptions = [...editBuffer.options];
        newOptions[idx] = value;
        setEditBuffer(prev => ({ ...prev, options: newOptions }));
    };

    if (loading) return (
        <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
            <p className="text-white/60 animate-pulse">Loading Room...</p>
        </div>
    );

    if (error || !quizData) return (
        <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Room Not Found</h2>
            <button onClick={() => navigate('/create')} className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-xl">Create New</button>
        </div>
    );

    const { questions, config, roomId: id } = quizData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button onClick={() => navigate('/create')} className="flex items-center gap-2 text-white/70 hover:text-white transition group w-fit">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Create</span>
                    </button>

                    <div className="bg-white/10 backdrop-blur-xl p-1 rounded-2xl border border-white/20 flex items-center shadow-xl">
                        <div className="px-6 py-3 border-r border-white/10">
                            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Room Code</p>
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 tracking-wider">
                                {id || roomId}
                            </h2>
                        </div>
                        <button onClick={copyInviteLink} className="px-6 hover:bg-white/5 transition flex items-center gap-2 group relative h-full">
                            {copied ? <Check className="text-emerald-400" size={24} /> : <Copy className="text-white/40 group-hover:text-white transition" size={24} />}
                        </button>
                    </div>
                </div>

                {/* Quiz Summary Card */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-pink-500/20 rounded-xl"><Users className="text-pink-400" size={20} /></div>
                                <span className="text-pink-400 font-bold tracking-widest uppercase text-xs">Waiting in Lobby</span>
                            </div>
                            <h1 className="text-5xl font-black text-white leading-tight">Ready to unleash <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">the knowledge?</span></h1>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10"><Layout size={20} className="text-indigo-400" /><p className="text-white font-bold text-lg">{questions.length}</p></div>
                                <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10"><Clock size={20} className="text-pink-400" /><p className="text-white font-bold text-lg">{config.timeLimit}s</p></div>
                                <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10"><Share2 size={20} className="text-emerald-400" /><p className="text-white font-bold text-lg capitalize">{config.mode}</p></div>
                            </div>
                        </div>
                        <button className="lg:h-64 lg:w-64 w-full bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(244,63,94,0.4)] transition hover:scale-[1.02] flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center"><Play size={40} className="text-white ml-2" fill="currentColor" /></div>
                            <span className="text-2xl font-black uppercase">Start Game</span>
                        </button>
                    </div>
                </div>

                {/* Questions Preview Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1.5 bg-indigo-500 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-white/90">Quiz Questions</h2>
                        </div>
                        <button onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition border border-indigo-500/30">
                            <Plus size={18} /> Add Question
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {questions.map((q, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 hover:border-indigo-500/50 transition-all duration-500 group relative">
                                {isEditing === index ? (
                                    <div className="space-y-6 relative z-10 w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-indigo-400 font-bold">Editing Question {index + 1}</span>
                                            <div className="flex gap-2">
                                                <button onClick={cancelEdit} className="p-2 bg-white/5 rounded-lg text-white/50 hover:text-white"><X size={20} /></button>
                                                <button onClick={() => saveEdit(index)} className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/30"><Save size={20} /></button>
                                            </div>
                                        </div>
                                        <input
                                            value={editBuffer.question}
                                            onChange={(e) => handleEditChange('question', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {editBuffer.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={editBuffer.correctAnswer === opt}
                                                        onChange={() => handleEditChange('correctAnswer', opt)}
                                                        className="accent-emerald-500 h-5 w-5"
                                                    />
                                                    <input
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                                                        className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-white text-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-8 relative z-10">
                                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center text-indigo-300 font-black text-2xl border border-white/5">{index + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between gap-4 mb-6">
                                                <p className="text-white font-bold text-2xl leading-relaxed">{q.question}</p>
                                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(index)} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"><Edit2 size={16} /></button>
                                                    <button onClick={() => deleteQuestion(index)} className="p-2 bg-white/5 rounded-lg text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((opt, optIndex) => (
                                                    <div key={optIndex} className={`p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between ${opt === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-black/40 border-white/5 text-white/40'}`}>
                                                        <span className="text-base font-semibold">{opt}</span>
                                                        {opt === q.correctAnswer && <CheckCircle2 size={18} className="text-emerald-400" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <footer className="mt-10 py-10 border-t border-white/5 text-center">
                <p className="text-white/20 text-sm font-medium tracking-[0.3em] uppercase">QuizX Premium Experience</p>
            </footer>
        </div>
    );
};

export default Lobby;
