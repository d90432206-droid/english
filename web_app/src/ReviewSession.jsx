import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { ArrowLeft, RotateCcw, Trophy, CheckCircle, Loader2 } from 'lucide-react'

const ReviewSession = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [reviewQueue, setReviewQueue] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [sessionStats, setSessionStats] = useState({ reviewed: 0 })

    useEffect(() => {
        fetchDueReviews()
    }, [])

    const fetchDueReviews = async () => {
        try {
            setLoading(true)
            const { data: progressItems, error: progressError } = await supabase
                .from('en_study_progress')
                .select('*')
                .lte('next_review_date', new Date().toISOString())
                .order('next_review_date', { ascending: true })
                .limit(50)

            if (progressError) throw progressError

            if (!progressItems || progressItems.length === 0) {
                setReviewQueue([])
                setLoading(false)
                return
            }

            const videoIds = [...new Set(progressItems.map(item => item.video_id))]
            const { data: videos, error: videosError } = await supabase
                .from('en_videos')
                .select('video_id, vocabulary')
                .in('video_id', videoIds)

            if (videosError) throw videosError

            const deck = []
            progressItems.forEach(item => {
                const video = videos.find(v => v.video_id === item.video_id)
                if (video && video.vocabulary) {
                    const vocabDetail = video.vocabulary.find(v => v.word === item.word)
                    if (vocabDetail) {
                        deck.push({ ...item, details: vocabDetail })
                    }
                }
            })

            setReviewQueue(deck)
        } catch (error) {
            console.error('Error fetching reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateSRS = async (e, quality) => {
        e.stopPropagation()
        const currentItem = reviewQueue[currentIndex]
        let interval = 1
        let status = 'review'
        let nextStreak = (currentItem.streak || 0) + 1

        if (quality === 0) { interval = 0; status = 'learning'; nextStreak = 0; }
        else if (quality === 3) { interval = Math.max(1, Math.floor(currentItem.interval * 1.2)); }
        else if (quality === 4) { interval = Math.max(1, Math.floor((currentItem.interval || 1) * 2.5)); }
        else if (quality === 5) { interval = Math.max(4, Math.floor((currentItem.interval || 1) * 3.5)); status = 'mastered'; }

        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + interval)
        setIsFlipped(false)

        try {
            await supabase
                .from('en_study_progress')
                .update({
                    status: status,
                    interval: interval,
                    streak: nextStreak,
                    next_review_date: nextDate.toISOString(),
                    last_reviewed_at: new Date().toISOString()
                })
                .eq('id', currentItem.id)

            setSessionStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }))
            if (currentIndex < reviewQueue.length) {
                setTimeout(() => setCurrentIndex(prev => prev + 1), 150)
            }
        } catch (err) {
            console.error('Failed to update SRS', err)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-[#f3f1e9] flex items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mr-3 text-amber-700" />
            <span className="font-bold uppercase tracking-widest text-xs">Analyzing Queue...</span>
        </div>
    )

    if (reviewQueue.length === 0) {
        return (
            <div className="min-h-screen bg-[#f3f1e9] flex flex-col items-center justify-center p-4">
                <div className="bg-[#fbf9f3] p-10 border-2 border-[#e7e4d8] text-center max-w-md w-full shadow-lg">
                    <CheckCircle className="w-20 h-20 text-emerald-500/50 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase italic tracking-tight">System Optimized</h2>
                    <p className="text-slate-500 mb-8 font-medium">No pending vocab data for review. Efficiency at 100%.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white font-bold uppercase tracking-widest shadow-md transition-all active:translate-y-0.5"
                    >
                        Return to Library
                    </button>
                </div>
            </div>
        )
    }

    if (currentIndex >= reviewQueue.length) {
        return (
            <div className="min-h-screen bg-[#f3f1e9] flex flex-col items-center justify-center p-4">
                <div className="bg-[#fbf9f3] p-10 border-2 border-[#e7e4d8] text-center max-w-md w-full animate-in zoom-in duration-300 shadow-xl">
                    <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase italic tracking-tight">Phase Complete</h2>
                    <p className="text-slate-500 mb-8 font-medium">Processed {sessionStats.reviewed} data packets today.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white font-bold uppercase tracking-widest shadow-md transition-all active:translate-y-0.5"
                    >
                        Store Analysis & Exit
                    </button>
                </div>
            </div>
        )
    }

    const card = reviewQueue[currentIndex]

    return (
        <div className="min-h-screen bg-[#f3f1e9] text-slate-800 p-4 md:p-8 font-sans flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-12">
                <Link to="/" className="text-slate-500 hover:text-amber-700 transition-colors p-2">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="text-center">
                    <h1 className="text-sm font-black text-slate-800 uppercase italic tracking-widest">Review Pipeline</h1>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                        PACKET {currentIndex + 1} / {reviewQueue.length}
                    </p>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Flashcard Area - Scaled to 380px height */}
            <div className="flex-1 w-full flex flex-col items-center max-w-md pt-4 pb-12">
                <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full h-[380px] cursor-pointer group perspective-1000 shadow-2xl"
                >
                    <div className={`absolute inset-0 w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front Side */}
                        <div className="absolute inset-0 w-full h-full bg-[#fbf9f3] border-2 border-[#e7e4d8] flex flex-col items-center justify-center p-6 backface-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.02)]">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">Packet_Analysis</span>
                            <h3 className="text-4xl sm:text-5xl font-black text-slate-800 text-center mb-4 tracking-tighter italic">
                                {card.word}
                            </h3>
                            <span className="px-3 py-1 bg-[#f3f1e9] text-slate-500 font-mono text-[10px] border border-[#e7e4d8] uppercase tracking-widest">
                                {card.details.phonetic || 'N/A'}
                            </span>
                            <p className="absolute bottom-6 text-slate-400 text-[9px] uppercase font-black flex items-center gap-2 animate-pulse tracking-widest">
                                <RotateCcw className="w-3 h-3" /> Reveal_Data
                            </p>
                        </div>

                        {/* Back Side */}
                        <div className="absolute inset-0 w-full h-full bg-[#1e293b] border-2 border-slate-700 shadow-2xl backface-hidden rotate-y-180 flex flex-col text-slate-200">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center justify-center">
                                <h4 className="text-2xl font-black text-amber-400 mb-2 text-center italic tracking-tight">
                                    {card.details.definition_zh || card.details.definition}
                                </h4>
                                <div className="w-8 h-1 bg-amber-600 mb-4 opacity-50" />
                                <div className="bg-slate-800/80 p-4 border-l-2 border-amber-600 w-full shadow-inner">
                                    <p className="text-slate-200 font-medium mb-2 leading-relaxed italic text-sm">
                                        "{card.details.example}"
                                    </p>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                                        {card.details.example_zh}
                                    </p>
                                </div>
                            </div>

                            {/* Actions - Industrial SRS Buttons (Fixed at bottom) */}
                            <div className="p-3 bg-slate-900 border-t border-slate-700">
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { l: 'Again', t: '1m', c: 'red' },
                                        { l: 'Hard', t: '1d', c: 'orange' },
                                        { l: 'Good', t: '3d', c: 'blue' },
                                        { l: 'Easy', t: '7d', c: 'emerald' }
                                    ].map((btn, i) => (
                                        <button
                                            key={i}
                                            onClick={(e) => updateSRS(e, [0, 3, 4, 5][i])}
                                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-none bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 hover:border-amber-600/50 hover:text-amber-400 transition-all active:translate-y-0.5`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-tighter">{btn.l}</span>
                                            <span className="text-[8px] font-bold opacity-30 uppercase mt-0.5">{btn.t}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReviewSession
