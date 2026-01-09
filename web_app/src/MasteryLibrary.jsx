import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { ArrowLeft, Search, BookOpen, Quote, ExternalLink, Filter, ChevronRight, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MasteryLibrary = () => {
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('vocab')
    const [searchQuery, setSearchQuery] = useState('')
    const [vocabList, setVocabList] = useState([])
    const [sentenceList, setSentenceList] = useState([])
    const [progressMap, setProgressMap] = useState({})

    useEffect(() => {
        fetchMasteryData()
    }, [])

    const fetchMasteryData = async () => {
        try {
            setLoading(true)

            // Fetch all videos for vocab and sentences
            const { data: videos, error: videosError } = await supabase
                .from('en_videos')
                .select('video_id, title, vocabulary, sentence_patterns')

            if (videosError) throw videosError

            // Fetch all study progress
            const { data: progress, error: progressError } = await supabase
                .from('en_study_progress')
                .select('*')

            if (progressError) throw progressError

            // Map progress for quick lookup
            const pMap = {}
            progress?.forEach(p => {
                pMap[`${p.video_id}_${p.word}`] = p
            })
            setProgressMap(pMap)

            // Process vocabulary
            const allVocab = []
            videos?.forEach(v => {
                v.vocabulary?.forEach(item => {
                    allVocab.push({
                        ...item,
                        video_id: v.video_id,
                        video_title: v.title || v.video_id,
                        progress: pMap[`${v.video_id}_${item.word}`]
                    })
                })
            })
            setVocabList(allVocab.sort((a, b) => a.word.localeCompare(b.word)))

            // Process sentences
            const allSentences = []
            videos?.forEach(v => {
                v.sentence_patterns?.forEach(item => {
                    allSentences.push({
                        ...item,
                        video_id: v.video_id,
                        video_title: v.title || v.video_id
                    })
                })
            })
            setSentenceList(allSentences)

        } catch (err) {
            console.error('Error fetching library data:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredVocab = vocabList.filter(item =>
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.definition_zh || '').includes(searchQuery)
    )

    const filteredSentences = sentenceList.filter(item =>
        item.structure.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.usage || '').includes(searchQuery)
    )

    const getStatusColor = (status) => {
        switch (status) {
            case 'mastered': return 'bg-emerald-500 text-white'
            case 'review': return 'bg-blue-500 text-white'
            case 'learning': return 'bg-amber-500 text-white'
            default: return 'bg-slate-200 text-slate-500'
        }
    }

    return (
        <div className="min-h-screen bg-[#f3f1e9] text-slate-800 p-4 md:p-8 font-sans max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <Link to="/" className="inline-flex items-center text-slate-500 hover:text-amber-700 mb-4 transition-colors font-bold uppercase tracking-wide text-[10px]">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black italic tracking-tighter text-slate-800 uppercase leading-none">
                        Mastery_<span className="text-amber-700">數據庫</span>
                    </h1>
                </div>

                <div className="flex bg-[#e7e4d8] p-1 gap-1 w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('vocab')}
                        className={`flex-1 md:flex-none px-6 py-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'vocab' ? 'bg-[#fbf9f3] text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        en_單字庫 ({vocabList.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('sentence')}
                        className={`flex-1 md:flex-none px-6 py-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sentence' ? 'bg-[#fbf9f3] text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        en_句型庫 ({sentenceList.length})
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        placeholder="搜尋已學過的內容..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#fbf9f3] border-2 border-[#e7e4d8] text-sm font-bold tracking-wide py-3 px-12 focus:outline-none focus:border-amber-700/50 transition-colors"
                    />
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-amber-700" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <Zap className="w-12 h-12 text-amber-700 opacity-20" />
                    </motion.div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {activeTab === 'vocab' ? (
                            filteredVocab.map((item, idx) => (
                                <motion.div
                                    key={`${item.video_id}_${item.word}`}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="bg-[#fbf9f3] border border-[#e7e4d8] p-5 hover:border-amber-700/30 transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{item.word}</h3>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 tracking-[0.2em] ${getStatusColor(item.progress?.status)}`}>
                                                {item.progress?.status || '未學習'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 mb-4">{item.definition_zh}</p>
                                        <div className="bg-[#f3f1e9] p-3 text-xs italic text-slate-500 border-l-2 border-amber-500/30 mb-4">
                                            "{item.example}"
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-[#e7e4d8] opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Link to={`/video/${item.video_id}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-amber-700 flex items-center gap-1">
                                            原影片: {item.video_title.substring(0, 20)}... <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            filteredSentences.map((item, idx) => (
                                <motion.div
                                    key={`${item.video_id}_${idx}`}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="bg-[#fbf9f3] border border-[#e7e4d8] p-5 hover:border-amber-700/30 transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <h3 className="text-md font-black text-amber-700 mb-2 border-b-2 border-amber-200 inline-block">{item.structure}</h3>
                                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">{item.usage}</p>
                                        <div className="bg-slate-800 text-slate-200 p-4 text-xs italic border border-slate-700 mb-4">
                                            "{item.example}"
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-[#e7e4d8] opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Link to={`/video/${item.video_id}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-amber-700 flex items-center gap-1">
                                            來源: {item.video_title.substring(0, 20)}... <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

export default MasteryLibrary
