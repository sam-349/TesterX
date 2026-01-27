import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Layout, Play, Users, Clock, ArrowLeft, CheckCircle2, Copy, Check, Share2, Edit2, Trash2, Plus, Save, X, User } from 'lucide-react';
import { io } from 'socket.io-client';

const Lobby = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const socketRef = useRef();

    const [quizData, setQuizData] = useState(location.state?.quiz || null);
    const [loading, setLoading] = useState(!quizData && roomId);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [editBuffer, setEditBuffer] = useState(null);
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        // Initialize Socket.io
        socketRef.current = io('http://localhost:3000');

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
            socketRef.current.emit('join_room', { roomId, username: localStorage.getItem('username') });
        });

        socketRef.current.on('room_data', ({ players }) => {
            setPlayers(players);
        });

        socketRef.current.on('game_started', ({ startTime }) => {
            navigate(`/game/${roomId}`, { state: { quiz: quizData } });
        });

        socketRef.current.on('error', ({ message }) => {
            alert(message);
        });

        if (!quizData && roomId) {
            fetchQuiz();
        }

        return () => {
            socketRef.current.disconnect();
        };
    }, [roomId]);

    const handleStartGame = () => {
        if (players.length < 2) {
            alert("At least 2 players are needed to start the quiz!");
            return;
        }
        socketRef.current.emit('start_quiz', { roomId });
    };

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
            <p className="text-white/60 animate-pulse">Entering Room...</p>
        </div>
    );

    if (error || !quizData) return (
        <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl max-w-md">
                <h2 className="text-2xl font-bold text-white mb-2">Room Not Found</h2>
                <button onClick={() => navigate('/create')} className="mt-6 px-8 py-3 bg-pink-500 text-white rounded-xl font-bold">Create New</button>
            </div>
        </div>
    );

    const { questions, config, roomId: id } = quizData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-10 font-sans">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button onClick={() => navigate('/create')} className="flex items-center gap-2 text-white/70 hover:text-white transition group w-fit">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Create</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-xl p-1 rounded-2xl border border-white/20 flex items-center shadow-xl">
                            <div className="px-6 py-3 border-r border-white/10">
                                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Room Code</p>
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 tracking-wider">
                                    {id || roomId}
                                </h2>
                            </div>
                            <button onClick={copyInviteLink} className="px-6 hover:bg-white/5 transition flex items-center gap-2 group relative h-full min-h-[70px]">
                                {copied ? <Check className="text-emerald-400" size={24} /> : <Copy className="text-white/40 group-hover:text-white transition" size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Summary & Players */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Quiz Summary Card */}
                        <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl"><Users className="text-indigo-400" size={18} /></div>
                                    <span className="text-indigo-400 font-bold tracking-widest uppercase text-xs">Multiplayer Lobby</span>
                                </div>
                                <h1 className="text-4xl font-black text-white leading-tight">Ready to challenge <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">your friends?</span></h1>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Layout size={16} className="text-white/40" font-bold /><span className="text-white font-bold">{questions.length} Qs</span></div>
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Clock size={16} className="text-white/40" /><span className="text-white font-bold">{config.timeLimit}s</span></div>
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Share2 size={16} className="text-white/40" /><span className="text-white font-bold capitalize">{config.mode}</span></div>
                                </div>
                            </div>

                            {localStorage.getItem('hostedRoom') === (id || roomId) ? (
                                <button
                                    onClick={handleStartGame}
                                    className={`mt-8 w-full py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 text-xl font-black uppercase tracking-tighter ${players.length >= 2
                                        ? "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-pink-500/20 hover:scale-[1.01]"
                                        : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                        }`}
                                >
                                    <Play size={24} fill={players.length >= 2 ? "currentColor" : "none"} />
                                    {players.length >= 2 ? "Start Quiz" : "Need 2 Players to Start"}
                                </button>
                            ) : (
                                <div className="mt-8 bg-black/20 p-6 rounded-2xl border border-white/5 text-center animate-pulse">
                                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm text-center">Waiting for host to start...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Player List */}
                    <div className="space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl h-full border-t-indigo-500/30">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-white">Players</h3>
                                <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase">{players.length} online</span>
                            </div>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {players.map((player) => (
                                    <div key={player.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/10 transition">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                                            {player.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-bold truncate">{player.username}</p>
                                            <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Connected</p>
                                        </div>
                                    </div>
                                ))}
                                {players.length === 0 && (
                                    <div className="text-center py-10">
                                        <User className="text-white/10 mx-auto mb-3" size={48} />
                                        <p className="text-white/20 text-sm font-medium">Waiting for joiners...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Preview Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            <h2 className="text-2xl font-bold text-white/90">Curated Quiz List</h2>
                        </div>
                        <button onClick={addQuestion} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white/70 rounded-2xl hover:bg-white/10 transition border border-white/10 hover:text-white">
                            <Plus size={18} /> <span className="text-sm font-bold">Add Question</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {questions.map((q, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 hover:border-indigo-500/50 transition-all duration-500 group relative">
                                {isEditing === index ? (
                                    <div className="space-y-6 relative z-10 w-full animate-in fade-in zoom-in duration-300">
                                        <div className="flex justify-between items-center bg-black/40 -m-8 p-6 mb-8 rounded-t-[2.5rem] border-b border-white/10">
                                            <span className="text-indigo-400 font-black uppercase text-xs tracking-[0.2em]">Editing Question {index + 1}</span>
                                            <div className="flex gap-2">
                                                <button onClick={cancelEdit} className="p-2.5 bg-white/5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"><X size={20} /></button>
                                                <button onClick={() => saveEdit(index)} className="px-5 py-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/30 transition flex items-center gap-2 font-bold"><Save size={18} /> SAVE</button>
                                            </div>
                                        </div>
                                        <div className="space-y-3 pt-4">
                                            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest ml-4">Question Text</p>
                                            <textarea
                                                value={editBuffer.question}
                                                onChange={(e) => handleEditChange('question', e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest ml-4">Options (Select radio for correct answer)</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {editBuffer.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5">
                                                        <input
                                                            type="radio"
                                                            name={`correct-${index}`}
                                                            checked={editBuffer.correctAnswer === opt}
                                                            onChange={() => handleEditChange('correctAnswer', opt)}
                                                            className="accent-emerald-500 h-6 w-6 cursor-pointer"
                                                        />
                                                        <input
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                                                            className="flex-1 bg-transparent border-none text-white text-base focus:ring-0 placeholder-white/10"
                                                            placeholder={`Option ${optIdx + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-8 relative z-10">
                                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center text-indigo-300 font-black text-3xl border border-white/5 shadow-inner">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between gap-6 mb-8 items-start">
                                                <p className="text-white font-bold text-2xl leading-relaxed">{q.question}</p>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button onClick={() => startEdit(index)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition border border-white/5"><Edit2 size={18} /></button>
                                                    <button onClick={() => deleteQuestion(index)} className="p-3 bg-rose-500/10 rounded-2xl text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/20 transition border border-rose-500/10"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((opt, optIndex) => (
                                                    <div key={optIndex} className={`p-6 rounded-[1.5rem] border-2 transition-all duration-300 flex items-center justify-between ${opt === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-black/40 border-white/5 text-white/30'}`}>
                                                        <span className="text-base font-bold tracking-tight">{opt}</span>
                                                        {opt === q.correctAnswer && (
                                                            <div className="bg-emerald-500/20 p-1 rounded-full"><CheckCircle2 size={18} className="text-emerald-400" /></div>
                                                        )}
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
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}} />
        </div>
    );
};

export default Lobby;
