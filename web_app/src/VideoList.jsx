import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { GraduationCap, Flame, Play, Calendar, Tag, ArrowRight, LayoutGrid, List, Search, Plus, Loader2, CheckCircle2, Trash2, Zap, Sparkles, BookOpen, BrainCircuit, ChevronLeft, ChevronRight, Hourglass, Dumbbell } from 'lucide-react'
import { format, subDays, startOfDay, isSameDay } from 'date-fns'
import { useNavigate, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import AddVideoModal from './AddVideoModal'
import LoginModal from './LoginModal'

const PuzzleLetter = ({ letter }) => {
    const letters = {
        'V': (
            <svg viewBox="0 0 100 100" className="w-9 h-9">
                <polygon points="0,0 50,100 30,30" fill="#1e293b" />
                <polygon points="100,0 50,100 70,30" fill="#d97706" />
            </svg>
        ),
        'O': (
            <svg viewBox="0 0 100 100" className="w-8 h-8">
                <rect x="10" y="10" width="80" height="80" fill="#1e293b" />
                <rect x="30" y="30" width="40" height="40" fill="#fff" />
                <polygon points="0,0 20,20 20,0" fill="#f59e0b" />
                <polygon points="100,100 80,80 80,100" fill="#f59e0b" />
            </svg>
        ),
        'C': (
            <svg viewBox="0 0 100 100" className="w-8 h-8">
                <path d="M90,20 L20,20 L20,80 L90,80" stroke="#1e293b" strokeWidth="20" fill="none" />
                <polygon points="0,0 30,30 0,30" fill="#d97706" />
                <polygon points="0,100 30,70 0,70" fill="#d97706" />
            </svg>
        ),
        'A': (
            <svg viewBox="0 0 100 100" className="w-8 h-8">
                <polygon points="50,0 0,100 100,100" fill="#1e293b" />
                <polygon points="50,30 35,70 65,70" fill="#fff" />
                <rect x="30" y="60" width="40" height="10" fill="#d97706" />
            </svg>
        ),
        'T': (
            <svg viewBox="0 0 100 100" className="w-8 h-8">
                <rect x="0" y="0" width="100" height="25" fill="#1e293b" />
                <rect x="37.5" y="25" width="25" height="75" fill="#d97706" />
            </svg>
        ),
        'U': (
            <svg viewBox="0 0 100 100" className="w-8 h-8">
                <path d="M20,0 L20,70 Q20,100 50,100 Q80,100 80,70 L80,0" stroke="#1e293b" strokeWidth="20" fill="none" />
                <rect x="0" y="0" width="20" height="30" fill="#f59e0b" />
                <rect x="80" y="0" width="20" height="30" fill="#f59e0b" />
            </svg>
        ),
        'B': (
            <svg viewBox="0 0 100 100" className="w-8 h-8">
                <path d="M20,0 L60,0 Q90,0 90,25 Q90,50 60,50 L20,50 L20,0" fill="#1e293b" />
                <path d="M20,50 L60,50 Q90,50 90,75 Q90,100 60,100 L20,100 L20,50" fill="#d97706" />
                <rect x="35" y="15" width="20" height="20" fill="#fff" />
                <rect x="35" y="65" width="20" height="20" fill="#fff" />
            </svg>
        ),
        'E': (
            <svg viewBox="0 0 100 100" className="w-8 h-8">
                <rect x="10" y="0" width="20" height="100" fill="#1e293b" />
                <rect x="30" y="0" width="60" height="20" fill="#d97706" />
                <rect x="30" y="40" width="40" height="20" fill="#f59e0b" />
                <rect x="30" y="80" width="60" height="20" fill="#d97706" />
            </svg>
        )
    };
    return letters[letter] || <div className="w-8 h-8 bg-slate-200" />;
};

const PuzzleLogo = () => (
    <div className="flex gap-1 items-end">
        {"VOCATUBE".split('').map((l, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                className="hover:rotate-6 transition-transform cursor-default"
            >
                <PuzzleLetter letter={l} />
            </motion.div>
        ))}
    </div>
);

const LearningMomentum = ({ streak, goalMet, stats }) => {
    // Industrial Gamification Logic
    const WORDS_PER_LEVEL = 50;
    const DAILY_VELOCITY = 5; // Target: 5 new words per day

    const currentLevel = Math.floor(stats.mastered / WORDS_PER_LEVEL) + 1;
    const nextLevelWords = currentLevel * WORDS_PER_LEVEL;
    const wordsToNextLevel = nextLevelWords - stats.mastered;
    const levelProgress = ((stats.mastered % WORDS_PER_LEVEL) / WORDS_PER_LEVEL) * 100;

    // Rank Titles System
    const RANKS = [
        "DATA_OBSERVER", "DATA_SCOUT", "INFO_BROKER", "GRID_RUNNER",
        "CYBER_ANALYST", "SYSTEM_OPERATOR", "NET_COMMANDER", "CORE_ARCHITECT"
    ];
    const currentRank = RANKS[Math.min(currentLevel - 1, RANKS.length - 1)];
    const nextRank = RANKS[Math.min(currentLevel, RANKS.length - 1)];

    // Time Estimation
    const daysToLevelUp = Math.ceil(wordsToNextLevel / DAILY_VELOCITY);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToLevelUp);
    const dateString = format(estimatedDate, 'MM/dd');

    return (
        <div className="bg-slate-800 border-2 border-slate-700 rounded-3xl p-6 mb-8 text-white relative overflow-hidden shadow-[8px_8px_0px_0px_#cbd5e1] group">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none text-right font-mono text-[10px] text-amber-500 leading-tight">
                SYS_STATUS: ONLINE<br />
                SYNC_RATE: {streak > 0 ? 'NOMINAL' : 'OFFLINE'}<br />
                CORE_VELOCITY: {DAILY_VELOCITY}/DAY
            </div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className={`w-6 h-6 ${goalMet ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-600'}`} />
                            <h2 className="text-2xl font-black tracking-tight italic uppercase">
                                學習原動力 <span className="text-slate-600 text-lg not-italic">// MOMENTUM</span>
                            </h2>
                        </div>
                        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                            當前狀態: <span className="text-amber-500">{goalMet ? '系統同步完成' : '等待數據輸入...'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-700/80 px-4 py-2 rounded-full border border-slate-600">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                        <span className="font-bold font-mono text-amber-500">STREAK: {streak} DAYS</span>
                    </div>
                </div>

                {/* Progress Bar Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <div className="inline-block bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded mb-1 tracking-widest uppercase">
                            系統權限升級 // SYSTEM_CLEARANCE
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mr-2">Target: LV.{currentLevel + 1} {nextRank}</span>
                            <span className="text-amber-500 font-black font-mono">{Math.round(levelProgress)}%</span>
                        </div>
                    </div>

                    <div className="h-3 bg-slate-950 rounded-full w-full overflow-hidden border border-slate-800 relative">
                        {/* Grid lines on progress bar */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 95%, #000 95%)', backgroundSize: '20px 100%' }}></div>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${levelProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        />
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-slate-600 font-mono">CURRENT: LV.{currentLevel} {currentRank}</span>
                        <span className="text-[10px] text-amber-600/80 font-mono font-bold">EST. UNLOCK: {dateString}</span>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mastery/Reward Card */}
                    <div className="bg-slate-800/40 rounded-xl p-4 flex items-center gap-4 border border-slate-700/50 hover:bg-slate-800/60 transition-colors group/card">
                        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 border border-slate-700 shadow-inner group-hover/card:border-amber-500/50 transition-colors">
                            <GraduationCap className="w-6 h-6 text-slate-400 group-hover/card:text-amber-400 transition-colors" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">即將解鎖 // NEXT_REWARD</div>
                            <div className="font-bold text-slate-200 flex items-center gap-2">
                                系統認證頭銜
                                <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">LV.{currentLevel + 1}</span>
                            </div>
                        </div>
                    </div>

                    {/* Time Remaining Card */}
                    <div className="bg-slate-800/40 rounded-xl p-4 flex items-center gap-4 border border-slate-700/50 hover:bg-slate-800/60 transition-colors group/card">
                        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 border border-slate-700 shadow-inner group-hover/card:border-amber-500/50 transition-colors">
                            <Hourglass className="w-6 h-6 text-slate-400 group-hover/card:text-amber-400 transition-colors" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">預計升級所需 // EST_TIME</div>
                            <div className="font-bold text-slate-200 text-lg">
                                約 <span className="text-amber-400 font-mono text-xl mx-0.5">{daysToLevelUp}</span> 天
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatBox = ({ label, value, subtext, color = "amber", icon: Icon }) => (
    <motion.div
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className={`bg-white border-2 border-slate-800 p-3 md:p-4 flex flex-col items-start min-w-[140px] md:min-w-[180px] shadow-[4px_4px_0px_0px_#e7e4d8] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_#d97706] transition-all`}
    >
        <div className="flex justify-between items-start w-full mb-1">
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic leading-none">{label}</span>
            {Icon && <Icon className={`w-4 h-4 text-slate-800 group-hover:text-amber-700 transition-colors`} />}
        </div>

        <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter tabular-nums leading-none">{value}</span>
            {subtext && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">項目</span>}
        </div>
        {subtext && (
            <div className={`mt-2 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 border border-slate-200`}>
                <div className={`w-1 h-1 bg-slate-800 group-hover:bg-amber-700 transition-colors`}></div>
                <span className={`text-[9px] text-slate-600 font-bold uppercase tracking-wider`}>{subtext}</span>
            </div>
        )}
    </motion.div>
)

const VideoList = () => {
    // ... existing state ...
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ mastered: 0, streak: 0, reviews: 0 })
    const [selectedTag, setSelectedTag] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
    const [watchedVideos, setWatchedVideos] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [goalMet, setGoalMet] = useState(false)
    const [streakHistory, setStreakHistory] = useState([])
    const pageSize = 12
    const navigate = useNavigate()

    const [user, setUser] = useState(null)

    useEffect(() => {
        fetchVideos()
        fetchStats()
        const watched = JSON.parse(localStorage.getItem('watched_videos') || '[]')
        setWatchedVideos(watched)

        // Fetch User for Admin Check
        const checkUser = async () => {
            // 1. Check Supabase Session
            const { data: { user } } = await supabase.auth.getUser()

            // 2. Check Dev Bypass (localStorage)
            const devSession = localStorage.getItem('dev_admin_session')

            if (user) {
                setUser(user)
            } else if (devSession === 'true') {
                // Restore Dev Admin
                setUser({ email: 'admin@vocatube.com', id: 'dev-admin' })
            }
        }
        checkUser()
    }, [])

    useEffect(() => {
        const hasActiveTasks = videos.some(v => v.status === 'pending' || v.status === 'processing')
        if (hasActiveTasks) {
            const interval = setInterval(() => {
                fetchVideos()
                fetchStats()
            }, 5000)
            return () => clearInterval(interval)
        }
    }, [videos])

    const fetchStats = async () => {
        try {
            // 1. Fetch Mastered Vocab Count
            const { count: masteredCount } = await supabase
                .from('study_progress')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'mastered')

            // 2. Fetch Active Reviews Count
            const { count: reviewCount } = await supabase
                .from('study_progress')
                .select('*', { count: 'exact', head: true })
                .lte('next_review_date', new Date().toISOString())

            // 3. Calculate Streak from Daily Activity Log
            const activity = JSON.parse(localStorage.getItem('daily_activity') || '[]')
            const today = format(new Date(), 'yyyy-MM-dd')

            // Generate 7-day history
            const history = []
            let currentStreak = 0

            // Check if goal met today (at least 1 activity)
            const todayActivity = activity.filter(a => format(new Date(a.timestamp), 'yyyy-MM-dd') === today)
            const isGoalMet = todayActivity.length > 0
            setGoalMet(isGoalMet)

            // Loop back to calculate streak and history
            for (let i = 0; i < 7; i++) {
                const date = subDays(new Date(), i)
                const dateStr = format(date, 'yyyy-MM-dd')
                const dayActivity = activity.filter(a => format(new Date(a.timestamp), 'yyyy-MM-dd') === dateStr)

                history.unshift({
                    date: dateStr,
                    count: dayActivity.length,
                    label: i === 0 ? 'Today' : format(date, 'EEE'),
                    isToday: i === 0
                })

                // Streak calculation: if date has activity, increment streak. If missing, break streak (except today if not yet met)
                if (dayActivity.length > 0) {
                    currentStreak++
                } else if (i > 0) {
                    // If we missed a day in the past, streak breaks
                    break
                }
            }

            setStreakHistory(history)
            setStats({
                mastered: masteredCount || 0,
                reviews: reviewCount || 0,
                streak: isGoalMet ? currentStreak : (currentStreak > 0 ? currentStreak : 0)
            })

        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    // ... existing fetchVideos, handleDelete, safeFormatDate ...
    const fetchVideos = async () => {
        try {
            const { data, error } = await supabase
                .from('english_videos')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            setVideos(data)
        } catch (error) {
            console.error('Error fetching videos:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (e, video_id) => {
        e.stopPropagation()

        // Debug logging
        console.log('Delete requested for:', video_id, 'User:', user?.email);

        // Admin Security Check
        const userEmail = user?.email || '';
        const isAdmin = userEmail === 'd9043@example.com' || userEmail.includes('admin') || userEmail.includes('d9043');

        if (!isAdmin) {
            console.warn('Access Denied. User:', userEmail);
            alert(`權限不足：只有系統管理員 (System Administrator) 可刪除影片。\n(Current User: ${userEmail || 'Guest'})`)
            return
        }

        if (!confirm('Are you sure you want to remove this video and data?')) return
        try {
            const { error } = await supabase
                .from('english_videos')
                .delete()
                .eq('video_id', video_id)
            if (error) throw error
            fetchVideos()
            fetchStats()
        } catch (error) {
            console.error('Error deleting video:', error.message)
            alert('Failed to delete video: ' + error.message)
        }
    }

    const safeFormatDate = (dateStr) => {
        try {
            if (!dateStr) return '新加入'
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return '新加入'
            return format(date, 'MMM dd')
        } catch (e) { return '新加入' }
    }

    const processedVideos = videos
        .filter(video => {
            const matchTag = selectedTag
                ? video.category && video.category.some(c => c.includes(selectedTag) || selectedTag.includes(c))
                : true
            const matchSearch = searchQuery
                ? (video.video_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    video.vocabulary?.some(v => v.word.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    video.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                : true
            return matchTag && matchSearch
        })
        .sort((a, b) => {
            const aWatched = watchedVideos.includes(a.video_id)
            const bWatched = watchedVideos.includes(b.video_id)
            if (aWatched && !bWatched) return 1
            if (!aWatched && bWatched) return -1
            return new Date(b.created_at) - new Date(a.created_at)
        })

    const totalPages = Math.ceil(processedVideos.length / pageSize)
    const currentVideos = processedVideos.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-[#f3f1e9]">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Loader2 className="w-12 h-12 text-amber-700" />
            </motion.div>
        </div>
    )

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-800">
            {/* Header / Nav */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-8 border-b-2 border-[#e7e4d8] pb-6"
            >
                <div className="flex items-center gap-4 md:gap-10">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-16 h-16 md:w-24 md:h-24 bg-white shadow-[4px_4px_0px_0px_#e7e4d8] md:shadow-[8px_8px_0px_0px_#e7e4d8] border-2 border-slate-800 p-2 flex items-center justify-center shrink-0"
                    >
                        <img src="/logo.svg" alt="VocaTube Logo" className="w-full h-full object-contain" />
                    </motion.div>

                    <div className="flex flex-col">
                        <div className="scale-75 md:scale-100 origin-left">
                            <PuzzleLogo />
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-2 border-slate-800 px-2 py-0.5 bg-white shadow-[2px_2px_0px_0px_#e7e4d8]">
                                V1.2.0_STABLE
                            </span>

                            {/* Login Trigger: Hidden in Metadata */}
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-slate-200 transition-colors group/login opacity-50 hover:opacity-100"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-slate-400'}`}></div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 group-hover/login:text-slate-600 uppercase tracking-widest">
                                    {user ? 'ADMIN' : 'GUEST'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <Link to="/library" className="group/lib ml-0 md:ml-4 w-full md:w-auto">
                        <motion.div
                            whileHover={{ x: 5 }}
                            className="relative bg-white border-2 border-slate-800 p-3 md:p-4 pr-10 md:pr-12 flex items-center gap-3 md:gap-5 hover:bg-amber-50 transition-colors shadow-[4px_4px_0px_0px_#e7e4d8] group-hover/lib:shadow-[4px_4px_0px_0px_#d97706] group-hover/lib:border-amber-700"
                        >
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                                </span>
                                <span className="text-[8px] font-black text-amber-800/40 uppercase tracking-tighter">Live</span>
                            </div>

                            <div className="bg-slate-900 p-2 text-white group-hover/lib:bg-amber-600 transition-colors">
                                <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Module_01</span>
                                <span className="text-md md:text-lg font-black text-slate-900 uppercase italic leading-none group-hover/lib:text-amber-700 transition-colors whitespace-nowrap">
                                    學習數據庫 <span className="inline-block group-hover/lib:translate-x-1 transition-transform">→</span>
                                </span>
                            </div>
                        </motion.div>
                    </Link>


                </div>

                <div className="flex md:flex-wrap gap-4 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                    <StatBox label="已擷取單字" value={stats.mastered} subtext="本週 +12" color="emerald" icon={GraduationCap} />
                    <Link to="/review" className="shrink-0">
                        <StatBox label="待複習項目" value={stats.reviews} subtext="需要練習" color="orange" icon={Dumbbell} />
                    </Link>
                </div>
            </motion.div>

            {/* Daily Learning Momentum Dashboard */}
            <LearningMomentum streak={stats.streak} goalMet={goalMet} stats={stats} />

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative bg-slate-800 rounded-px p-6 md:p-10 mb-8 md:mb-12 overflow-hidden border-b-4 border-amber-600 shadow-2xl group"
            >
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-600/20 transition-colors" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-600/5 rotate-45 -translate-x-1/2 translate-y-1/2 group-hover:bg-amber-600/10 transition-colors" />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fbbf24 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 mb-4"
                        >
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-400 text-sm font-black uppercase tracking-[0.3em]">AI 驅動的英文學習系統</span>
                        </motion.div>
                        <h2 className="text-2xl md:text-5xl font-black text-white uppercase italic leading-[1.1] md:leading-[0.95] tracking-tighter mb-4 md:mb-6">
                            搜尋喜歡的影片<br />
                            <span className="text-amber-500">複製網址即可學習。</span>
                        </h2>
                        <p className="text-slate-400 text-xs md:text-md leading-relaxed mb-6 md:mb-8 max-w-md font-medium">
                            只需從 YouTube 找出想看的英文影片，複製網址並點擊下方的「匯入新來源」，AI 將自動為您擷取核心單字與句型。
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs px-6 md:8 py-3 md:py-4 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] active:translate-y-0.5"
                            >
                                <Plus className="w-4 h-4" />
                                匯入新來源
                            </button>
                            <Link to="/review" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] md:text-xs px-6 md:8 py-3 md:py-4 transition-all border border-white/10 flex items-center justify-center gap-2">
                                <Dumbbell className="w-4 h-4" />
                                快速複習
                            </Link>
                        </div>
                    </div>

                    {/* Industrial Animation Element */}
                    <div className="hidden lg:block relative w-64 h-64">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                            className="absolute inset-0 border-2 border-dashed border-amber-600/30 rounded-full"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                            className="absolute inset-4 border border-amber-600/20 rounded-full flex items-center justify-center"
                        >
                            <Zap className="w-12 h-12 text-amber-500/50" />
                        </motion.div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border-2 border-amber-600/50 p-6 shadow-[0_0_40px_rgba(217,119,6,0.2)]">
                            <span className="text-4xl font-black text-amber-500 tabular-nums">42</span>
                            <div className="text-[10px] text-amber-500/60 font-black uppercase tracking-widest text-center">學習紀錄</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative group w-full md:w-96">
                        <input
                            type="text"
                            placeholder="搜尋影片或單字..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#fbf9f3] border-2 border-[#e7e4d8] text-slate-800 text-sm font-bold tracking-wide py-3 px-4 pl-12 focus:outline-none focus:border-amber-700/50 transition-colors placeholder:text-slate-400 placeholder:italic"
                        />
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-amber-700" />
                    </div>

                    <div className="flex bg-[#e7e4d8] p-1 gap-1 h-fit">
                        <button onClick={() => setViewMode('grid')} className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-[#fbf9f3] text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2 transition-all ${viewMode === 'list' ? 'bg-[#fbf9f3] text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-1 px-2 w-full md:w-auto">
                        <button onClick={() => { setSelectedTag(null); setCurrentPage(1); }}
                            className={`px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${!selectedTag ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-transparent text-slate-500 border-transparent hover:border-[#e7e4d8]'}`}>
                            全部
                        </button>
                        {['Social', 'Work', 'Travel', 'Culture', 'Academic'].map(tag => (
                            <button key={tag} onClick={() => { setSelectedTag(tag); setCurrentPage(1); }}
                                className={`px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${selectedTag === tag ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-transparent text-slate-500 border-transparent hover:border-[#e7e4d8]'}`}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Video Content */}
            <motion.div
                layout
                className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-4"}
            >
                <AnimatePresence mode="popLayout">
                    {currentVideos.map((video, idx) => (
                        <motion.div
                            key={video.video_id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(`/video/${video.video_id}`)}
                            className={`group bg-[#fbf9f3] border border-[#e7e4d8] cursor-pointer hover:border-amber-700/50 transition-all relative overflow-hidden shadow-sm hover:shadow-xl ${viewMode === 'list' ? 'flex flex-row p-3 gap-6 h-[120px]' : ''} ${watchedVideos.includes(video.video_id) ? 'opacity-70' : ''}`}
                        >
                            {/* Scanning Animation */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500 z-20 hidden group-hover:block animate-scan pointer-events-none" />

                            <div className={`relative bg-slate-200 overflow-hidden ${viewMode === 'list' ? 'w-[180px] h-full border shrink-0' : 'aspect-video border-b'}`}>
                                <img
                                    src={video.thumbnail || video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                                    alt="Thumbnail"
                                    className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                                />
                                {watchedVideos.includes(video.video_id) && (
                                    <div className="absolute top-2 left-2 z-30 bg-amber-700 text-white p-1 shadow-lg">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                )}
                                <div className="absolute top-0 right-0 p-2 flex gap-2 z-50">
                                    <button onClick={(e) => handleDelete(e, video.video_id)} className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 shadow-md backdrop-blur-sm transition-all hover:scale-110">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
                                    <div className={`h-full bg-amber-600 transition-all duration-1000 ${video.status === 'completed' ? 'w-full' : video.status === 'processing' ? 'w-2/3 animate-pulse' : 'w-1/3'}`}></div>
                                </div>
                            </div>

                            <div className={`p-5 flex flex-col ${viewMode === 'list' ? 'justify-center flex-1 min-w-0' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        {video.category?.map((c, i) => (
                                            <span key={i} className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest">#{c}</span>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">{safeFormatDate(video.created_at)}</span>
                                </div>

                                <h3 className={`font-black text-slate-800 leading-tight mb-4 uppercase italic truncate group-hover:text-amber-700 transition-colors ${viewMode === 'list' ? 'text-md' : 'text-lg line-clamp-2'}`}>
                                    {video.status === 'completed' ? (video.title || `數據單元_${video.video_id}`) : (video.status === 'processing' ? '正在處理數據...' : '排隊中...')}
                                </h3>

                                <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                    {video.vocabulary?.slice(0, 4).map((v, i) => (
                                        <span key={i} className="bg-[#e7e4d8] text-slate-600 text-[9px] px-1.5 py-0.5 font-mono border border-[#d6d3c7]">
                                            {v.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border-2 border-[#e7e4d8] bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-10 h-10 font-bold border-2 transition-all ${currentPage === i + 1 ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'bg-white border-[#e7e4d8] text-slate-400 hover:border-slate-300'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border-2 border-[#e7e4d8] bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            <AddVideoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVideoAdded={fetchVideos}
            />

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLoginSuccess={setUser}
            />
        </div>
    )
}

export default VideoList
