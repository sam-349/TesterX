import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Layout, Play, Users, Clock, ArrowLeft, CheckCircle2, Copy, Check, Share2, Edit2, Trash2, Plus, Save, X, User, Eye, EyeOff, Zap, Layers } from 'lucide-react';
import { io } from 'socket.io-client';

const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐨', '🦄', '🐶', '🐯', '🐺', '🦝', '🐮', '🐧'];

const Lobby = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const socketRef = useRef();

    const [quizData, setQuizData] = useState(location.state?.quiz || null);
    const [loading, setLoading] = useState(!quizData && !!roomId);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [editBuffer, setEditBuffer] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameStarted, setGameStarted] = useState(false); // host observer state

    // --- Role Detection ---
    const isHost = localStorage.getItem('hostedRoom') === roomId;

    // --- Host Participation ---
    // Seed from CreateQuiz navigation state (user's choice before generating quiz)
    const [isParticipating, setIsParticipating] = useState(
        location.state?.isParticipating ?? false
    );
    const isParticipatingRef = useRef(isParticipating);
    useEffect(() => { isParticipatingRef.current = isParticipating; }, [isParticipating]);

    // --- Profile Setup (for participants joining via shared link) ---
    const hasUsername = !!localStorage.getItem('username');
    const [profileReady, setProfileReady] = useState(isHost || hasUsername);
    const [showProfileSetup, setShowProfileSetup] = useState(!isHost && !hasUsername);
    const [tempUsername, setTempUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(localStorage.getItem('avatar') || '🦊');

    // Ref so socket handlers always see the latest quizData
    const quizDataRef = useRef(quizData);
    useEffect(() => { quizDataRef.current = quizData; }, [quizData]);

    const handleProfileConfirm = () => {
        if (!tempUsername.trim()) return;
        localStorage.setItem('username', tempUsername.trim());
        localStorage.setItem('avatar', selectedAvatar);
        setProfileReady(true);
        setShowProfileSetup(false);
    };

    // --- Socket Connection (only after profile is ready) ---
    useEffect(() => {
        if (!profileReady) return;

        socketRef.current = io('http://localhost:3000');

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
            socketRef.current.emit('join_room', {
                roomId,
                username: localStorage.getItem('username') || 'Guest',
                avatar: localStorage.getItem('avatar') || '🦊'
            });
        });

        socketRef.current.on('room_data', ({ players }) => {
            setPlayers(players);
        });

        socketRef.current.on('game_started', () => {
            if (!isHost || isParticipatingRef.current) {
                // Participant or participating host → go to game
                navigate(`/game/${roomId}`, { state: { quiz: quizDataRef.current } });
            } else {
                // Host chose not to participate → observer mode
                setGameStarted(true);
            }
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
    }, [roomId, profileReady]);

    const handleStartGame = () => {
        if (players.length < 2) {
            alert('At least 2 players are needed to start the quiz!');
            return;
        }
        socketRef.current.emit('start_quiz', { roomId });
    };

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/quiz/${roomId}`, { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                setQuizData(result.data);
            } else {
                setError(result.error || 'Quiz not found');
            }
        } catch (err) {
            setError('Unable to connect to server');
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
            console.error('Failed to sync changes to server:', err);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/join/${roomId || quizData?.roomId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const startEdit = (index) => { setIsEditing(index); setEditBuffer({ ...quizData.questions[index] }); };
    const cancelEdit = () => { setIsEditing(null); setEditBuffer(null); };
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
        if (!window.confirm('Delete this question?')) return;
        const newQuestions = quizData.questions.filter((_, i) => i !== index);
        const updatedData = { ...quizData, questions: newQuestions };
        setQuizData(updatedData);
        saveToBackend(updatedData);
    };
    const addQuestion = () => {
        const newQuestion = { question: 'New Question Text', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], correctAnswer: 'Option 1' };
        const updatedData = { ...quizData, questions: [...quizData.questions, newQuestion] };
        setQuizData(updatedData);
        saveToBackend(updatedData);
        startEdit(updatedData.questions.length - 1);
    };
    const handleEditChange = (field, value) => setEditBuffer(prev => ({ ...prev, [field]: value }));
    const handleOptionChange = (idx, value) => {
        const newOptions = [...editBuffer.options];
        newOptions[idx] = value;
        setEditBuffer(prev => ({ ...prev, options: newOptions }));
    };

    // ─── Profile Setup Modal ───────────────────────────────────────────────────
    if (showProfileSetup) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-4">
                <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-3xl -mr-16 -mt-16"></div>

                        <div className="text-center mb-8">
                            <div className="text-5xl mb-4">{selectedAvatar}</div>
                            <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Set Up Your Profile</h1>
                            <p className="text-white/40 text-sm">Choose your avatar and enter your name to join</p>
                        </div>

                        {/* Avatar Picker */}
                        <div className="mb-6">
                            <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.2em] mb-3">Choose Avatar</p>
                            <div className="grid grid-cols-6 gap-2">
                                {AVATARS.map(avatar => (
                                    <button
                                        key={avatar}
                                        onClick={() => setSelectedAvatar(avatar)}
                                        className={`h-12 w-full rounded-2xl text-2xl flex items-center justify-center transition-all border-2 ${
                                            selectedAvatar === avatar
                                                ? 'bg-indigo-500/30 border-indigo-400 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                                        }`}
                                    >
                                        {avatar}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="mb-6">
                            <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.2em] mb-3">Your Name</p>
                            <input
                                type="text"
                                placeholder="Enter your name..."
                                value={tempUsername}
                                onChange={e => setTempUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleProfileConfirm()}
                                maxLength={20}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleProfileConfirm}
                            disabled={!tempUsername.trim()}
                            className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-lg rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                        >
                            Join Lobby →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Loading / Error ──────────────────────────────────────────────────────
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
                <p className="text-white/40 text-sm mb-6">The quiz room doesn't exist or has expired.</p>
                <button onClick={() => navigate('/create')} className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition">Create New Quiz</button>
            </div>
        </div>
    );

    // ─── Host Observer Screen (host chose not to participate) ─────────────────
    if (gameStarted && isHost && !isParticipating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-[3rem] p-12 border border-white/20 shadow-2xl text-center">
                    <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                        <Eye className="text-indigo-400" size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">Observing Game</h2>
                    <p className="text-white/40 font-medium mb-2">The quiz is live with <span className="text-indigo-400 font-bold">{players.length} players</span></p>
                    <p className="text-white/20 text-sm mb-8">You're watching as host. Players are answering now.</p>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {players.map(p => (
                            <div key={p.id} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                <span>{p.avatar || '🎮'}</span>
                                <span className="text-white font-bold text-sm">{p.username}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/')} className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition border border-white/10">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const { questions, config, roomId: id } = quizData;
    const isFlashMode = config?.mode === 'flash';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-10 font-sans">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button onClick={() => navigate(isHost ? '/create' : '/')} className="flex items-center gap-2 text-white/70 hover:text-white transition group w-fit">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{isHost ? 'Back to Create' : 'Back to Home'}</span>
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

                    {/* Left: Lobby Control Card */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl"><Users className="text-indigo-400" size={18} /></div>
                                    <span className="text-indigo-400 font-bold tracking-widest uppercase text-xs">Multiplayer Lobby</span>
                                </div>
                                <h1 className="text-4xl font-black text-white leading-tight">Ready to challenge <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">your friends?</span></h1>

                                {/* Quiz Stats */}
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                        <Layout size={14} className="text-white/40" />
                                        {/* Bug 4 Fix: show config.questionCount for participants, actual count for host */}
                                        <span className="text-white font-bold text-sm">
                                            {isHost ? questions.length : (config.questionCount || questions.length)} Qs
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                        <Clock size={14} className="text-white/40" />
                                        <span className="text-white font-bold text-sm">
                                            {isFlashMode
                                                ? (config.timeLimit >= 60 ? `${config.timeLimit / 60}m total` : `${config.timeLimit}s total`)
                                                : `${config.timeLimit}s / Q`}
                                        </span>
                                    </div>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${
                                        isFlashMode
                                            ? 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                    }`}>
                                        {isFlashMode ? <Zap size={14} /> : <Layers size={14} />}
                                        <span className="capitalize">{config.mode}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Host Controls */}
                            {isHost ? (
                                <div className="mt-8 space-y-4 relative z-10">
                                    {/* Bug 1 Fix: Host participation checkbox */}
                                    <div
                                        onClick={() => setIsParticipating(prev => !prev)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                            isParticipating
                                                ? 'bg-emerald-500/10 border-emerald-500/40'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            isParticipating
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-white/20 bg-transparent'
                                        }`}>
                                            {isParticipating && <Check size={14} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${isParticipating ? 'text-emerald-400' : 'text-white/60'}`}>
                                                I'm also playing
                                            </p>
                                            <p className="text-white/30 text-xs">
                                                {isParticipating ? 'You will be redirected to the quiz when it starts' : 'You will observe the quiz as host'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Start Button */}
                                    <button
                                        onClick={handleStartGame}
                                        className={`w-full py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 text-xl font-black uppercase tracking-tighter ${
                                            players.length >= 2
                                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-pink-500/20 hover:scale-[1.01]'
                                                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                        }`}
                                    >
                                        <Play size={24} fill={players.length >= 2 ? 'currentColor' : 'none'} />
                                        {players.length >= 2 ? 'Start Quiz' : `Need ${2 - players.length} More Player${2 - players.length !== 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            ) : (
                                // Participant waiting view
                                <div className="mt-8 relative z-10">
                                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5 text-center">
                                        <div className="flex justify-center mb-3">
                                            <div className="flex -space-x-2">
                                                {['⏳', '🎯', '🏆'].map((e, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-indigo-500/20 border border-white/10 flex items-center justify-center text-sm"
                                                        style={{ animationDelay: `${i * 0.2}s` }}>
                                                        {e}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm animate-pulse">Waiting for host to start...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Player List */}
                    <div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-white">Players</h3>
                                <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase">{players.length} online</span>
                            </div>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {players.map((player) => (
                                    <div key={player.id} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition">
                                        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-xl flex items-center justify-center text-xl border border-white/10">
                                            {player.avatar || player.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold truncate text-sm">{player.username}</p>
                                            <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Connected</p>
                                        </div>
                                        {/* Badge if this is the current user */}
                                        {player.username === localStorage.getItem('username') && (
                                            <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">You</span>
                                        )}
                                    </div>
                                ))}
                                {players.length === 0 && (
                                    <div className="text-center py-10">
                                        <User className="text-white/10 mx-auto mb-3" size={48} />
                                        <p className="text-white/20 text-sm font-medium">Waiting for players...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Section — visible to host only, with participation toggle */}
                {isHost && (
                    <div className="space-y-6 pt-4">

                        {/* Section Header + Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                <h2 className="text-2xl font-bold text-white/90">Curated Quiz List</h2>
                                <span className="text-white/20 text-sm font-bold">({questions.length} questions)</span>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Participation toggle — always visible for host */}
                                <button
                                    onClick={() => setIsParticipating(prev => !prev)}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border-2 font-bold text-sm transition-all duration-300 ${
                                        isParticipating
                                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                            : 'bg-white/5 border-white/15 text-white/50 hover:border-white/30 hover:text-white/70'
                                    }`}
                                >
                                    {isParticipating
                                        ? <><EyeOff size={16} /> I'm Playing</>
                                        : <><Eye size={16} /> I'm Watching</>}
                                </button>

                                {/* Add question — only shown when not participating */}
                                {!isParticipating && (
                                    <button onClick={addQuestion} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white/70 rounded-2xl hover:bg-white/10 transition border border-white/10 hover:text-white text-sm font-bold">
                                        <Plus size={16} /> Add Question
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* When host is playing — hide questions, show locked state */}
                        {isParticipating ? (
                            <div className="relative rounded-[2.5rem] overflow-hidden border border-emerald-500/20">
                                {/* Blurred background preview */}
                                <div className="blur-sm pointer-events-none select-none opacity-30 space-y-4 p-8">
                                    {questions.slice(0, 3).map((q, i) => (
                                        <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                            <div className="h-4 bg-white/20 rounded-full w-3/4 mb-4"></div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[1,2,3,4].map(j => (
                                                    <div key={j} className="h-10 bg-white/10 rounded-xl"></div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Overlay message */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2.5rem]">
                                    <div className="text-center px-8">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                            <EyeOff className="text-emerald-400" size={32} />
                                        </div>
                                        <h3 className="text-white font-black text-xl mb-2">Questions Hidden</h3>
                                        <p className="text-white/40 text-sm mb-6 leading-relaxed">
                                            You're set to play along. Questions are hidden<br />so you get the same experience as participants.
                                        </p>
                                        <button
                                            onClick={() => setIsParticipating(false)}
                                            className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white/70 rounded-2xl border border-white/20 hover:bg-white/20 hover:text-white transition font-bold text-sm mx-auto"
                                        >
                                            <Eye size={16} /> Switch to Watching Mode
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (

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
                                                <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest ml-4">Options (select radio for correct answer)</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {editBuffer.options.map((opt, optIdx) => (
                                                        <div key={optIdx} className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${index}`}
                                                                checked={editBuffer.correctAnswer === opt}
                                                                onChange={() => handleEditChange('correctAnswer', opt)}
                                                                className="accent-emerald-500 h-5 w-5 cursor-pointer flex-shrink-0"
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
                                        <div className="flex gap-6 relative z-10">
                                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center text-indigo-300 font-black text-2xl border border-white/5">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between gap-4 mb-6 items-start">
                                                    <p className="text-white font-bold text-xl leading-relaxed">{q.question}</p>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                                        <button onClick={() => startEdit(index)} className="p-2.5 bg-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition border border-white/5"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteQuestion(index)} className="p-2.5 bg-rose-500/10 rounded-2xl text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/20 transition border border-rose-500/10"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {q.options.map((opt, optIndex) => (
                                                        <div key={optIndex} className={`p-4 rounded-[1.2rem] border-2 flex items-center justify-between transition-all ${opt === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-black/40 border-white/5 text-white/30'}`}>
                                                            <span className="text-sm font-bold">{opt}</span>
                                                            {opt === q.correctAnswer && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        )} {/* end isParticipating ? locked : questions */}
                    </div>
                )}

                {/* Participant view: no questions shown */}
                {!isHost && (
                    <div className="text-center py-8 bg-white/5 rounded-[2rem] border border-white/10">
                        <div className="text-4xl mb-3">🎮</div>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Quiz Ready</p>
                        <p className="text-white/20 text-xs mt-1">Questions will appear when the host starts the game</p>
                    </div>
                )}

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
