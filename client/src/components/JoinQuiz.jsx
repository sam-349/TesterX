import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, ArrowLeft, Search, User } from 'lucide-react';

const JoinQuiz = () => {
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
    const navigate = useNavigate();

    const handleJoin = (e) => {
        e.preventDefault();
        if (roomId.trim()) {
            localStorage.setItem('username', username || `Guest_${Math.random().toString(36).substring(7)}`);
            navigate(`/lobby/${roomId.trim().toUpperCase()}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex flex-col items-center justify-center p-4">
            <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>

            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-3xl -mr-16 -mt-16"></div>

                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10 rotate-3">
                            <Layout className="text-white" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Join a Quiz</h1>
                        <p className="text-white/40 text-sm font-medium">Enter the 6-digit room code to play</p>
                    </div>

                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-pink-400 transition" size={20} />
                                <input
                                    type="text"
                                    placeholder="Your Name (Optional)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-lg placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition shadow-inner"
                                />
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition" size={20} />
                                <input
                                    type="text"
                                    placeholder="Room Code (Ex: A1B2C3)"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-2xl font-black tracking-widest placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition uppercase shadow-inner"
                                    maxLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!roomId.trim()}
                            className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/20 transform transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest"
                        >
                            Enter Lobby
                        </button>
                    </form>

                    <p className="mt-8 text-center text-white/20 text-xs font-bold uppercase tracking-[0.2em]">
                        Waiting for friends? <span className="text-pink-400/50 cursor-pointer hover:text-pink-400" onClick={() => navigate('/create')}>Create one</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JoinQuiz;
