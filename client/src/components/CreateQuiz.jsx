import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, Users, Layers, Hash, Zap, Loader2, FileText, X, Clock } from 'lucide-react';

const CreateQuiz = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);

    const [formData, setFormData] = useState({
        topic: '',
        mode: 'general',
        difficulty: 'medium',
        questionCount: 10,
        generationMethod: 'ai',
        aiPrompt: '',
        maxPlayers: 8,
        timeLimit: 15,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleModeSelect = (mode) => {
        setFormData(prev => ({
            ...prev,
            mode,
            timeLimit: mode === 'flash' ? 60 : 15 // Default 1m for Flash, 15s for General
        }));
    };

    const handleDifficultySelect = (difficulty) => {
        setFormData(prev => ({ ...prev, difficulty }));
    };

    const handleMethodSelect = (method) => {
        setFormData(prev => ({ ...prev, generationMethod: method }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let response;

            if (formData.generationMethod === 'ai') {
                // Generate from prompt
                response = await fetch('http://localhost:3000/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: formData.aiPrompt || formData.topic,
                        mode: formData.mode,
                        difficulty: formData.difficulty,
                        questionCount: formData.questionCount,
                        timeLimit: formData.timeLimit
                    })
                });
            } else {
                // Generate from file
                if (!file) {
                    alert('Please upload a file');
                    setIsLoading(false);
                    return;
                }

                const data = new FormData();
                data.append('file', file);
                data.append('mode', formData.mode);
                data.append('difficulty', formData.difficulty);
                data.append('questionCount', formData.questionCount);
                data.append('timeLimit', formData.timeLimit);

                response = await fetch('http://localhost:3000/api/upload', {
                    method: 'POST',
                    body: data
                });
            }

            const result = await response.json();

            if (result.success) {
                console.log('Quiz Generated:', result.data);
                localStorage.setItem('hostedRoom', result.data.roomId);
                navigate(`/lobby/${result.data.roomId}`, { state: { quiz: result.data, config: formData } });
            } else {
                alert('Error: ' + result.error);
            }

        } catch (error) {
            console.error('Error creating quiz:', error);
            alert('Failed to create quiz. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">

                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-white ml-4">Create New Quiz</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Topic Section */}
                    {formData.generationMethod === 'ai' && (
                        <div className="space-y-2">
                            <label className="text-white/80 text-sm font-medium ml-1">Quiz Topic</label>
                            <input
                                type="text"
                                name="topic"
                                value={formData.topic}
                                onChange={handleInputChange}
                                required={formData.generationMethod === 'ai' && !formData.aiPrompt} // Required if prompt is empty
                                placeholder="e.g., Solar System, 90s Music, Javascript Basics"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                            />
                        </div>
                    )}

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => handleModeSelect('flash')}
                            className={`p-4 rounded-xl border transition flex flex-col items-center justify-center gap-2 ${formData.mode === 'flash'
                                ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                }`}
                        >
                            <Zap size={24} />
                            <span className="font-semibold">Flash Mode</span>
                            <span className="text-xs opacity-70">Time-pressured</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeSelect('general')}
                            className={`p-4 rounded-xl border transition flex flex-col items-center justify-center gap-2 ${formData.mode === 'general'
                                ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                }`}
                        >
                            <Layers size={24} />
                            <span className="font-semibold">General Mode</span>
                            <span className="text-xs opacity-70">Standard flow</span>
                        </button>
                    </div>

                    {/* Configuration Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Difficulty */}
                        <div className="space-y-2">
                            <label className="text-white/80 text-sm font-medium ml-1">Difficulty</label>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/10">
                                {['easy', 'medium', 'hard'].map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => handleDifficultySelect(level)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${formData.difficulty === level
                                            ? 'bg-white/20 text-white shadow-sm'
                                            : 'text-white/40 hover:text-white/70'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question Count */}
                        <div className="space-y-2">
                            <label className="text-white/80 text-sm font-medium ml-1 flex items-center gap-2">
                                <Hash size={14} /> Question Count
                            </label>
                            <input
                                type="number"
                                name="questionCount"
                                min="1"
                                max="50"
                                value={formData.questionCount}
                                onChange={handleInputChange}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                        </div>

                        {/* Max Players */}
                        <div className="space-y-2">
                            <label className="text-white/80 text-sm font-medium ml-1 flex items-center gap-2">
                                <Users size={14} /> Max Players
                            </label>
                            <input
                                type="number"
                                name="maxPlayers"
                                min="1"
                                max="100"
                                value={formData.maxPlayers}
                                onChange={handleInputChange}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                        </div>

                        {/* Time Limit */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-white/80 text-sm font-medium ml-1 flex items-center gap-2">
                                <Clock size={14} />
                                {formData.mode === 'flash' ? 'Total Quiz Time' : 'Time per Question (Seconds)'}
                            </label>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/10">
                                {formData.mode === 'flash' ? (
                                    // Flash Mode Options: 30s, 1m (60s), 3m (180s)
                                    [30, 60, 180].map((time) => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, timeLimit: time }))}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${formData.timeLimit === time
                                                ? 'bg-gradient-to-r from-pink-500/50 to-rose-500/50 text-white shadow-sm border border-pink-500/30'
                                                : 'text-white/40 hover:text-white/70'
                                                }`}
                                        >
                                            {time < 60 ? `${time}s` : `${time / 60}m`}
                                        </button>
                                    ))
                                ) : (
                                    // General Mode Options: 10s, 15s, 30s, 60s
                                    [10, 15, 30, 60].map((time) => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, timeLimit: time }))}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${formData.timeLimit === time
                                                ? 'bg-white/20 text-white shadow-sm'
                                                : 'text-white/40 hover:text-white/70'
                                                }`}
                                        >
                                            {time}s
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Generation Method */}
                    <div className="space-y-4">
                        <label className="text-white/80 text-sm font-medium ml-1">Content Generation</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => handleMethodSelect('ai')}
                                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition ${formData.generationMethod === 'ai'
                                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-cyan-500 text-cyan-300'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                    }`}
                            >
                                <Sparkles size={18} /> AI Generate
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMethodSelect('upload')}
                                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition ${formData.generationMethod === 'upload'
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500 text-emerald-300'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                    }`}
                            >
                                <Upload size={18} /> Upload Doc
                            </button>
                        </div>

                        {/* Dynamic Content Area */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            {formData.generationMethod === 'ai' ? (
                                <textarea
                                    name="aiPrompt"
                                    value={formData.aiPrompt}
                                    onChange={handleInputChange}
                                    placeholder="Describe your quiz? e.g. 'Generate 10 impossible trivia questions about 80s action movies'"
                                    className="w-full bg-transparent text-white placeholder-white/30 text-sm focus:outline-none resize-none h-24"
                                />
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        accept=".pdf,.txt"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {!file ? (
                                        <label
                                            htmlFor="file-upload"
                                            className="border-2 border-dashed border-white/20 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/40 transition"
                                        >
                                            <Upload className="text-white/30 mb-2" size={32} />
                                            <p className="text-white/60 text-sm font-medium">Click to upload Document</p>
                                            <p className="text-white/30 text-xs mt-1">PDF, TXT supported (Max 5MB)</p>
                                        </label>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                    <FileText className="text-emerald-400" size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                                    <p className="text-white/40 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 transform transition hover:scale-[1.02] active:scale-[0.98] text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Generating Quiz...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate Quiz
                            </>
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default CreateQuiz;
