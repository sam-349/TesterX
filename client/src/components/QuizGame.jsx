import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Trophy, Home, Zap, Layers } from 'lucide-react';

const QuizGame = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Bug 5 Fix: Use state so we can populate it via fetch if not in location.state
    const [quiz, setQuiz] = useState(location.state?.quiz || null);
    const [fetchLoading, setFetchLoading] = useState(!location.state?.quiz);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [showCorrection, setShowCorrection] = useState(false);

    const timerRef = useRef();

    // Flash mode: single session timer
    // General mode: per-question timer
    const isFlashMode = quiz?.config?.mode === 'flash';

    const [timeLeft, setTimeLeft] = useState(
        isFlashMode ? (quiz?.config?.timeLimit || 60) : (quiz?.config?.timeLimit || 15)
    );

    // Bug 5 Fix: Fetch quiz from server if not passed via navigation state
    useEffect(() => {
        if (!location.state?.quiz) {
            fetch(`http://localhost:3000/api/quiz/${roomId}`, { method: 'POST' })
                .then(r => r.json())
                .then(result => {
                    if (result.success) {
                        setQuiz(result.data);
                        // Initialize timer based on fetched data
                        const mode = result.data?.config?.mode;
                        const limit = result.data?.config?.timeLimit;
                        setTimeLeft(limit || (mode === 'flash' ? 60 : 15));
                    } else {
                        navigate('/');
                    }
                })
                .catch(() => navigate('/'))
                .finally(() => setFetchLoading(false));
        }
    }, []);

    // -------------------------------------------------------------------
    // FLASH MODE: Single session-wide countdown (starts once, never resets)
    // -------------------------------------------------------------------
    useEffect(() => {
        if (!quiz || !isFlashMode) return;

        // Start the global session timer once
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setIsFinished(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [quiz, isFlashMode]); // Runs once when quiz is loaded

    // -------------------------------------------------------------------
    // GENERAL MODE: Per-question countdown (resets on each question change)
    // -------------------------------------------------------------------
    useEffect(() => {
        if (!quiz || isFlashMode) return;

        clearInterval(timerRef.current);
        setTimeLeft(quiz.config?.timeLimit || 15);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleNextRef.current();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [currentIndex, quiz, isFlashMode]);

    // Use a ref for handleNext so timer callbacks always have the latest version
    const handleNextRef = useRef();

    const handleNext = () => {
        if (!quiz) return;
        if (currentIndex < quiz.questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowCorrection(false);
        } else {
            setIsFinished(true);
            clearInterval(timerRef.current);
        }
    };

    useEffect(() => {
        handleNextRef.current = handleNext;
    });

    const handleOptionSelect = (option) => {
        if (selectedOption || showCorrection) return;

        setSelectedOption(option);
        setShowCorrection(true);

        // In general mode, stop the per-question timer on answer
        if (!isFlashMode) {
            clearInterval(timerRef.current);
        }

        if (quiz && option === quiz.questions[currentIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }

        // Auto-advance to next question after showing correction
        setTimeout(() => {
            handleNextRef.current();
        }, 1500);
    };

    // Loading State
    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
                <p className="text-white/60 animate-pulse">Loading Quiz...</p>
            </div>
        );
    }

    if (!quiz) return null;

    // Finished Screen
    if (isFinished) {
        const percentage = Math.round((score / quiz.questions.length) * 100);
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-[3rem] p-12 border border-white/20 shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/20 blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 blur-3xl -ml-16 -mb-16"></div>

                    <Trophy className="text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" size={80} />
                    <h2 className="text-4xl font-black text-white mb-2">Quiz Complete!</h2>
                    <p className="text-white/40 font-bold tracking-widest uppercase text-xs mb-8">Your Final Score</p>

                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-2">
                        {score}/{quiz.questions.length}
                    </div>
                    <p className="text-white/40 font-bold text-lg mb-10">{percentage}% Correct</p>

                    <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/10">
                        <p className="text-white/30 text-xs uppercase font-bold tracking-widest mb-1">Performance</p>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-1000"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-5 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition flex items-center justify-center gap-3 border border-white/10"
                    >
                        <Home size={20} /> Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = quiz.questions[currentIndex];
    const progress = ((currentIndex + 1) / quiz.questions.length) * 100;
    const isTimeLow = isFlashMode ? timeLeft <= 10 : timeLeft <= 5;

    // Flash mode: format time as MM:SS
    const formatTime = (secs) => {
        if (!isFlashMode) return `${secs}s`;
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4 md:p-8 flex flex-col items-center">
            <div className="max-w-3xl w-full">

                {/* Header Info */}
                <div className="flex justify-between items-center mb-8 px-4">
                    <div className="flex items-center gap-3">
                        {/* Mode Badge */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                            isFlashMode
                                ? 'bg-pink-500/20 border-pink-500/40 text-pink-400'
                                : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                        }`}>
                            {isFlashMode ? <Zap size={12} /> : <Layers size={12} />}
                            {isFlashMode ? 'Flash' : 'General'}
                        </div>

                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                            isTimeLow
                                ? 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                : 'bg-white/5 border-white/10'
                        }`}>
                            <Clock className={isTimeLow ? 'text-rose-400 animate-pulse' : 'text-indigo-400'} size={18} />
                            <span className={`text-xl font-black tabular-nums ${isTimeLow ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Question</p>
                        <p className="text-white font-black text-xl">{currentIndex + 1} <span className="text-white/20">/ {quiz.questions.length}</span></p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full mb-10 overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Question Card */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-10 md:p-14 border border-white/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 blur-3xl -ml-12 -mt-12"></div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-tight relative z-10">
                        {currentQ.question}
                    </h2>

                    <div className="grid grid-cols-1 gap-4 relative z-10">
                        {currentQ.options.map((option, idx) => {
                            const isCorrect = option === currentQ.correctAnswer;
                            const isSelected = option === selectedOption;

                            let stateStyles = "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 cursor-pointer";

                            if (showCorrection) {
                                if (isCorrect) stateStyles = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]";
                                else if (isSelected) stateStyles = "bg-rose-500/20 border-rose-500/50 text-rose-400";
                                else stateStyles = "bg-white/5 border-white/5 text-white/20 opacity-50";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={showCorrection}
                                    className={`p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between text-left ${stateStyles}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-white/20 font-black text-sm w-6 text-center">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="text-base font-bold">{option}</span>
                                    </div>
                                    {showCorrection && isCorrect && <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0" />}
                                    {showCorrection && isSelected && !isCorrect && <XCircle size={22} className="text-rose-400 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Score */}
                <div className="mt-6 text-center">
                    <p className="text-white/20 text-xs font-bold uppercase tracking-[0.4em]">Score: {score} / {currentIndex + 1}</p>
                </div>
            </div>
        </div>
    );
};

export default QuizGame;
