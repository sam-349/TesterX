import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Trophy, ArrowRight, Home } from 'lucide-react';

const QuizGame = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const quiz = location.state?.quiz;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(quiz?.config?.timeLimit || 15);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [showCorrection, setShowCorrection] = useState(false);

    const timerRef = useRef();

    useEffect(() => {
        if (!quiz) {
            navigate(`/lobby/${roomId}`);
            return;
        }

        startTimer();

        return () => clearInterval(timerRef.current);
    }, [currentIndex]);

    const startTimer = () => {
        clearInterval(timerRef.current);
        setTimeLeft(quiz.config.timeLimit || 15);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleNext();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleOptionSelect = (option) => {
        if (selectedOption || showCorrection) return;

        setSelectedOption(option);
        setShowCorrection(true);
        clearInterval(timerRef.current);

        if (option === quiz.questions[currentIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            handleNext();
        }, 2000);
    };

    const handleNext = () => {
        if (currentIndex < quiz.questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowCorrection(false);
        } else {
            setIsFinished(true);
            clearInterval(timerRef.current);
        }
    };

    if (isFinished) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-[3rem] p-12 border border-white/20 shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-3xl -mr-16 -mt-16"></div>
                    <Trophy className="text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" size={80} />
                    <h2 className="text-4xl font-black text-white mb-2">Quiz Complete!</h2>
                    <p className="text-white/40 font-bold tracking-widest uppercase text-xs mb-8">Your Final Score</p>

                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-10">
                        {score}/{quiz.questions.length}
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-5 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition flex items-center justify-center gap-3 border border-white/10"
                        >
                            <Home size={20} /> Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = quiz.questions[currentIndex];
    const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4 md:p-8 flex flex-col items-center">
            <div className="max-w-3xl w-full">
                {/* Header Info */}
                <div className="flex justify-between items-center mb-8 px-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl"><Clock className="text-indigo-400" size={20} /></div>
                        <span className={`text-2xl font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}s
                        </span>
                    </div>

                    <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Question</p>
                        <p className="text-white font-black text-xl">{currentIndex + 1} <span className="text-white/20">/ {quiz.questions.length}</span></p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-white/5 rounded-full mb-12 overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Question Card */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-10 md:p-14 border border-white/20 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 blur-3xl -ml-12 -mt-12"></div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 leading-tight relative z-10">
                        {currentQ.question}
                    </h2>

                    <div className="grid grid-cols-1 gap-4 relative z-10">
                        {currentQ.options.map((option, idx) => {
                            const isCorrect = option === currentQ.correctAnswer;
                            const isSelected = option === selectedOption;

                            let stateStyles = "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20";

                            if (showCorrection) {
                                if (isCorrect) stateStyles = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]";
                                else if (isSelected) stateStyles = "bg-rose-500/20 border-rose-500/50 text-rose-400";
                                else stateStyles = "bg-white/5 border-white/10 text-white/20 opacity-50";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={showCorrection}
                                    className={`p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between text-left group ${stateStyles}`}
                                >
                                    <span className="text-lg font-bold">{option}</span>
                                    {showCorrection && isCorrect && <CheckCircle2 size={24} className="text-emerald-400" />}
                                    {showCorrection && isSelected && !isCorrect && <XCircle size={24} className="text-rose-400" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Score */}
                <div className="mt-8 text-center">
                    <p className="text-white/20 text-xs font-bold uppercase tracking-[0.4em]">Current Score: {score}</p>
                </div>
            </div>
        </div>
    );
};

export default QuizGame;
