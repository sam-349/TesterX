import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400 text-center mb-2">
                    QuizX
                </h1>
                <p className="text-gray-300 text-center mb-10 text-lg">
                    Create, Share, and Play Quizzes Live.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/create')}
                        className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95 text-xl"
                    >
                        Create Quiz
                    </button>

                    <button
                        onClick={() => navigate('/join')}
                        className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 backdrop-blur-sm transform transition hover:scale-105 active:scale-95 text-xl"
                    >
                        Join Quiz
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Ready to challenge your friends?
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;
