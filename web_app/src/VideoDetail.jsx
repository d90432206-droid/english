import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { ArrowLeft, BookOpen, Quote, Calendar, GraduationCap, ChevronLeft, ChevronRight, RotateCcw, PlayCircle } from 'lucide-react'
import { format } from 'date-fns'
import YouTube from 'react-youtube'

const VideoDetail = () => {
    const { id } = useParams()
    const [video, setVideo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('vocab')
    const [player, setPlayer] = useState(null)

    // Practice Mode State
    const [practiceMode, setPracticeMode] = useState('flashcard')
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [quizState, setQuizState] = useState({ selected: null, isCorrect: null })
    const [sessionFinished, setSessionFinished] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (activeTab === 'practice') {
            setCurrentCardIndex(0)
            setIsFlipped(false)
            setPracticeMode('flashcard')
            setQuizState({ selected: null, isCorrect: null })
            setSessionFinished(false)
        }
    }, [activeTab])

    const handleNextCard = () => {
        if (video.vocabulary && currentCardIndex < video.vocabulary.length - 1) {
            setIsFlipped(false)
            setQuizState({ selected: null, isCorrect: null })
            setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150)
        } else {
            setSessionFinished(true)
        }
    }

    const handlePrevCard = (e) => {
        e.stopPropagation()
        if (currentCardIndex > 0) {
            setIsFlipped(false)
            setQuizState({ selected: null, isCorrect: null })
            setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150)
        }
    }

    // SRS Logic
    const updateSRS = async (e, quality) => {
        e.stopPropagation()
        if (isSaving) return

        setIsSaving(true)
        const word = video.vocabulary[currentCardIndex].word
        let interval = 1
        let status = 'learning'

        if (quality === 0) { interval = 0; status = 'learning'; }
        else if (quality === 3) { interval = 1; status = 'review'; }
        else if (quality === 4) { interval = 3; status = 'review'; }
        else if (quality === 5) { interval = 7; status = 'mastered'; }

        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + interval)

        try {
            await supabase
                .from('study_progress')
                .upsert({
                    video_id: video.video_id,
                    word: word,
                    status: status,
                    interval: interval,
                    next_review_date: nextDate.toISOString(),
                    last_reviewed_at: new Date().toISOString()
                }, { onConflict: 'video_id, word' })

            handleNextCard()
        } catch (error) {
            console.error('Error updating SRS:', error)
        } finally {
            setIsSaving(false)
        }
    }

    useEffect(() => {
        fetchVideoDetail()

        // Record as watched for UI status (Existing logic)
        const watched = JSON.parse(localStorage.getItem('watched_videos') || '[]')
        if (!watched.includes(id)) {
            localStorage.setItem('watched_videos', JSON.stringify([...watched, id]))
        }

        // Record Daily Activity for Streak Power Core
        const activity = JSON.parse(localStorage.getItem('daily_activity') || '[]')
        const today = new Date().toISOString().split('T')[0]

        // Only add if not already activity for today or to keep it simple, just add the timestamp
        // and VideoList will filter. It's better to store timestamps to be precise.
        const newActivity = [...activity, { id, timestamp: new Date().toISOString() }]
        localStorage.setItem('daily_activity', JSON.stringify(newActivity))
    }, [id])

    const fetchVideoDetail = async () => {
        try {
            const { data, error } = await supabase
                .from('english_videos')
                .select('*')
                .eq('video_id', id)
                .single()
            if (error) throw error
            setVideo(data)
        } catch (error) {
            console.error('Error details:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const onPlayerReady = (event) => setPlayer(event.target)

    const seekTo = (seconds) => {
        if (player) {
            player.seekTo(seconds, true)
            player.playVideo()
        }
    }

    const handleQuizAnswer = (answer) => {
        if (quizState.selected) return
        const correct = video.vocabulary[currentCardIndex].word
        const isCorrect = answer === correct
        setQuizState({ selected: answer, isCorrect })
    }

    const getQuizOptions = (correctWord) => {
        const allWords = video.vocabulary.map(v => v.word)
        const distractors = allWords.filter(w => w !== correctWord)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
        return [...distractors, correctWord].sort(() => 0.5 - Math.random())
    }

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-[#f3f1e9]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
        </div>
    )

    if (!video) return (
        <div className="text-center text-slate-500 mt-20 bg-[#f3f1e9] h-screen">
            Video not found. <Link to="/" className="text-amber-600 hover:underline">Go back</Link>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#f3f1e9] text-slate-800 p-4 md:p-8 font-sans overflow-x-hidden">
            {/* Navigation */}
            <Link to="/" className="inline-flex items-center text-slate-500 hover:text-amber-700 mb-6 transition-colors font-bold uppercase tracking-wide text-xs">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
            </Link>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Left Column: Sticky Video & Meta */}
                <div className="lg:col-span-7 lg:sticky lg:top-8 space-y-6">
                    <div className="relative aspect-video rounded-none shadow-lg border-4 border-white bg-black">
                        <YouTube
                            videoId={video.video_id}
                            onReady={onPlayerReady}
                            className="absolute inset-0 w-full h-full"
                            iframeClassName="w-full h-full"
                            opts={{
                                width: '100%',
                                height: '100%',
                                playerVars: { autoplay: 0, modestbranding: 1, rel: 0 },
                            }}
                        />
                    </div>

                    <div className="bg-[#fbf9f3] p-6 border border-[#e7e4d8] shadow-sm">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {video.category && video.category.map((tag, idx) => (
                                <span key={idx} className="bg-[#e7e4d8] text-slate-600 text-[10px] uppercase font-bold px-2 py-1 tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-2xl font-black text-slate-800 mb-2 leading-tight uppercase italic tracking-tight">
                            {video.title || "Video Interpretation Data"}
                        </h1>

                        <div className="flex items-center text-slate-400 text-xs font-mono mb-4">
                            <Calendar className="w-3 h-3 mr-2" />
                            <span>Added on {format(new Date(video.created_at), 'MMM dd, yyyy')}</span>
                        </div>

                        <a
                            href={`https://www.youtube.com/watch?v=${video.video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-amber-700 hover:text-amber-800 text-xs font-bold uppercase tracking-widest hover:underline"
                        >
                            Open Source Link ↗
                        </a>
                    </div>
                </div>

                {/* Right Column: Learning Materials */}
                <div className="lg:col-span-5 space-y-6 lg:h-[calc(100vh-140px)] lg:overflow-y-auto pr-0 md:pr-2 custom-scrollbar lg:sticky lg:top-8 pb-10">

                    {/* Tabs */}
                    <div className="flex p-1 bg-[#e7e4d8] rounded-none border border-[#d4d1c0]">
                        <button
                            onClick={() => setActiveTab('vocab')}
                            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'vocab'
                                ? 'bg-[#fbf9f3] text-amber-700 shadow-sm border border-[#d4d1c0]'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            Vocabulary
                        </button>
                        <button
                            onClick={() => setActiveTab('sentence')}
                            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'sentence'
                                ? 'bg-[#fbf9f3] text-amber-700 shadow-sm border border-[#d4d1c0]'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Quote className="w-3.5 h-3.5" />
                            Sentences
                        </button>
                        <button
                            onClick={() => setActiveTab('practice')}
                            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'practice'
                                ? 'bg-[#fbf9f3] text-amber-700 shadow-sm border border-[#d4d1c0]'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Practice
                        </button>
                    </div>

                    {/* Tab Content: Vocabulary */}
                    {activeTab === 'vocab' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {video.vocabulary && video.vocabulary.map((vocab, idx) => (
                                <div key={idx} className="group p-5 bg-[#fbf9f3] border border-[#e7e4d8] hover:border-amber-700/30 transition-all shadow-sm">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{vocab.word}</h3>
                                        <span className="text-xs text-slate-500 font-mono bg-[#f3f1e9] px-2 py-1 border border-[#e7e4d8]">{vocab.phonetic}</span>
                                    </div>

                                    <div className="space-y-1.5 mb-4">
                                        <p className="text-base text-slate-700 font-bold">
                                            {vocab.definition_zh || vocab.definition}
                                        </p>
                                        {vocab.definition_zh && (
                                            <p className="text-xs text-slate-400">
                                                {vocab.definition}
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-[#f3f1e9] p-3 border-l-4 border-amber-500/50 italic text-slate-600">
                                        <p className="text-sm mb-1 text-slate-800 font-medium">
                                            "{vocab.example}"
                                        </p>
                                        {vocab.example_zh && (
                                            <p className="text-xs text-slate-500 not-italic">
                                                {vocab.example_zh}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab Content: Sentences */}
                    {activeTab === 'sentence' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {video.sentence_patterns && video.sentence_patterns.map((pattern, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => seekTo(pattern.timestamp)}
                                    className={`p-5 bg-[#fbf9f3] border border-[#e7e4d8] transition-all ${pattern.timestamp !== undefined
                                        ? 'cursor-pointer hover:border-amber-500/50 hover:bg-[#fffdf8]'
                                        : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-md font-bold text-slate-700 font-mono border-b-2 border-amber-200 inline-block pb-1">{pattern.structure}</h3>
                                        {pattern.timestamp !== undefined && (
                                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-none flex items-center gap-1 uppercase tracking-wider">
                                                <PlayCircle className="w-3 h-3" />
                                                {Math.floor(pattern.timestamp / 60)}:{String(pattern.timestamp % 60).padStart(2, '0')}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">{pattern.usage}</p>

                                    <div className="bg-[#f3f1e9] p-4 border border-[#e7e4d8]">
                                        <div className="flex gap-2">
                                            <span className="text-amber-700 font-bold text-sm mt-0.5">Ex:</span>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-800 italic">{pattern.example}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab Content: Practice Mode */}
                    {activeTab === 'practice' && video.vocabulary && video.vocabulary.length > 0 && (
                        <div className="flex flex-col items-center pt-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            <div className="flex bg-[#e7e4d8] p-1 mb-6 border border-[#d4d1c0]">
                                <button
                                    onClick={() => setPracticeMode('flashcard')}
                                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${practiceMode === 'flashcard' ? 'bg-[#fbf9f3] text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Flashcards
                                </button>
                                <button
                                    onClick={() => setPracticeMode('quiz')}
                                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${practiceMode === 'quiz' ? 'bg-[#fbf9f3] text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Quiz Mode
                                </button>
                            </div>

                            {sessionFinished ? (
                                <div className="w-full max-w-sm h-[380px] bg-[#fbf9f3] border-2 border-[#e7e4d8] flex flex-col items-center justify-center p-8 shadow-lg animate-in zoom-in duration-300">
                                    <GraduationCap className="w-16 h-16 text-amber-600 mb-6 drop-shadow-lg" />
                                    <h3 className="text-2xl font-black text-slate-800 text-center mb-2 uppercase italic">數據分析完成！</h3>
                                    <p className="text-slate-500 text-base font-medium text-center mb-10 leading-relaxed">
                                        本單元的單字量已全部練習完畢。<br />
                                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold italic mt-2 block">Status: Optimized</span>
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSessionFinished(false);
                                            setCurrentCardIndex(0);
                                            setIsFlipped(false);
                                        }}
                                        className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white font-bold uppercase tracking-widest shadow-lg shadow-amber-900/20 active:translate-y-0.5 transition-all"
                                    >
                                        重新開始練習
                                    </button>
                                </div>
                            ) : practiceMode === 'flashcard' ? (
                                <div
                                    onClick={() => !isSaving && setIsFlipped(!isFlipped)}
                                    className={`relative w-full max-w-sm h-[380px] cursor-pointer group perspective-1000 ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <div className={`absolute inset-0 w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                        {/* Front (Light) */}
                                        <div className="absolute inset-0 w-full h-full bg-[#fbf9f3] border-2 border-[#e7e4d8] shadow-lg flex flex-col items-center justify-center p-6 backface-hidden hover:border-amber-400/50 transition-colors">
                                            <span className="text-slate-400 text-[9px] font-bold tracking-widest uppercase mb-3">Vocabulary Module</span>
                                            <h3 className="text-4xl font-black text-slate-800 text-center mb-2 tracking-tight">
                                                {video.vocabulary[currentCardIndex].word}
                                            </h3>
                                            <span className="px-3 py-1 bg-[#f3f1e9] text-slate-500 font-mono text-xs border border-[#e7e4d8]">
                                                {video.vocabulary[currentCardIndex].phonetic}
                                            </span>
                                            <p className="absolute bottom-6 text-slate-400 text-[9px] uppercase font-bold flex items-center gap-2 animate-pulse">
                                                <RotateCcw className="w-3 h-3" /> Click to reveal data
                                            </p>
                                        </div>

                                        {/* Back (Dark for contrast) */}
                                        <div className="absolute inset-0 w-full h-full bg-[#1e293b] border border-slate-700 shadow-2xl backface-hidden rotate-y-180 overflow-y-auto custom-scrollbar text-slate-200">
                                            <div className="min-h-full w-full flex flex-col items-center justify-center p-6 sm:p-8">
                                                <div className="text-center w-full space-y-6">
                                                    <div>
                                                        <h4 className="text-xl font-bold text-emerald-400 mb-2">
                                                            {video.vocabulary[currentCardIndex].definition_zh || "No definition"}
                                                        </h4>
                                                        <p className="text-slate-400 text-sm italic">
                                                            {video.vocabulary[currentCardIndex].definition}
                                                        </p>
                                                    </div>
                                                    <div className="w-full h-px bg-slate-700" />
                                                    <div className="bg-slate-800/50 p-4 border border-slate-700/50">
                                                        <p className="text-slate-200 text-md font-medium mb-1">
                                                            "{video.vocabulary[currentCardIndex].example}"
                                                        </p>
                                                        <p className="text-slate-500 text-xs">
                                                            {video.vocabulary[currentCardIndex].example_zh}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-8 grid grid-cols-4 gap-2 w-full max-w-sm">
                                                    {[
                                                        { l: 'Again', t: '1m', c: 'red' },
                                                        { l: 'Hard', t: '1d', c: 'orange' },
                                                        { l: 'Good', t: '3d', c: 'blue' },
                                                        { l: 'Easy', t: '7d', c: 'emerald' }
                                                    ].map((btn, i) => (
                                                        <button
                                                            key={i}
                                                            disabled={isSaving}
                                                            onClick={(e) => updateSRS(e, [0, 3, 4, 5][i])}
                                                            className={`flex flex-col items-center justify-center p-2 rounded bg-slate-800 border border-slate-700 hover:bg-${btn.c}-900/30 hover:border-${btn.c}-500/50 hover:text-${btn.c}-400 transition-all active:scale-95 disabled:opacity-50`}
                                                        >
                                                            <span className="text-[10px] font-bold">{isSaving ? '...' : btn.l}</span>
                                                            <span className="text-[8px] opacity-50">{btn.t}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Quiz Container - Fixed Alignment */
                                <div className="w-full max-w-md bg-[#fbf9f3] p-6 border border-[#e7e4d8] min-h-[380px] h-auto flex flex-col items-center justify-center shadow-sm">
                                    <span className="text-amber-700 text-[10px] font-bold uppercase tracking-widest mb-6 block w-full text-center">Fill Missing Data</span>

                                    <div className="w-full bg-[#f3f1e9] p-6 mb-8 border-2 border-dashed border-[#e7e4d8] flex items-center justify-center min-h-[140px]">
                                        <p className="text-xl text-slate-800 font-bold leading-relaxed text-center">
                                            {(() => {
                                                const current = video.vocabulary[currentCardIndex]
                                                const parts = current.example.split(new RegExp(`(${current.word})`, 'gi'))
                                                return parts.map((part, i) =>
                                                    part.toLowerCase() === current.word.toLowerCase()
                                                        ? <span key={i} className="inline-block w-24 border-b-2 border-amber-600 mx-1 align-baseline"></span>
                                                        : part
                                                )
                                            })()}
                                        </p>
                                    </div>

                                    <div className="w-full grid grid-cols-1 gap-3">
                                        {getQuizOptions(video.vocabulary[currentCardIndex].word).map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuizAnswer(option)}
                                                disabled={quizState.selected !== null}
                                                className={`w-full p-4 font-bold text-sm border-2 transition-all ${quizState.selected === option
                                                    ? (quizState.isCorrect ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-red-100 border-red-500 text-red-700 shadow-inner')
                                                    : (quizState.selected && option === video.vocabulary[currentCardIndex].word ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-[#e7e4d8] text-slate-600 hover:border-amber-400')
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>

                                    {quizState.selected && (
                                        <div className={`mt-6 text-center animate-in zoom-in duration-300 ${quizState.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                                            <p className="font-bold text-sm uppercase tracking-wide">
                                                {quizState.isCorrect ? '√ Optimal Analysis' : '× Recalibration Required'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Controls */}
                            <div className="flex items-center gap-6 mt-8">
                                <button onClick={handlePrevCard} disabled={currentCardIndex === 0} className="p-3 bg-white border border-[#e7e4d8] text-slate-400 hover:text-amber-700 disabled:opacity-50 transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="font-mono text-slate-400 font-bold text-xs">{currentCardIndex + 1} / {video.vocabulary.length}</span>
                                <button onClick={handleNextCard} disabled={currentCardIndex === video.vocabulary.length - 1} className="p-3 bg-amber-700 text-white hover:bg-amber-800 shadow-lg shadow-amber-700/20 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none transition-all">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VideoDetail
