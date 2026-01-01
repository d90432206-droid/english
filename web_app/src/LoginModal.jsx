import { useState } from 'react'
import { supabase } from './supabaseClient'
import { X, ShieldCheck, Loader2, Lock, User, Terminal } from 'lucide-react'

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [mode, setMode] = useState('login') // 'login' or 'signup'

    if (!isOpen) return null

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (mode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                onLoginSuccess(data.user)
                onClose()
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                alert('系統註冊成功！請檢查信箱進行驗證，或直接登入 (視 Supabase 設定而定)。')
                setMode('login')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Dev Bypass for testing if Supabase Auth is not fully configured
    const handleDevBypass = () => {
        const mockUser = { email: 'admin@vocatube.com', id: 'dev-admin' }
        localStorage.setItem('dev_admin_session', 'true') // Persist Dev Session
        onLoginSuccess(mockUser)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e293b] border-2 border-slate-600 w-full max-w-md shadow-2xl overflow-hidden relative group">
                {/* Decorative Tech Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-amber-600 to-transparent"></div>

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-[#0f172a]">
                    <h3 className="text-lg font-black text-amber-500 flex items-center gap-2 uppercase tracking-widest">
                        <ShieldCheck className="w-5 h-5" />
                        System Access
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-amber-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleAuth} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Identity // Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-slate-600 py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 font-mono"
                                    placeholder="admin@system.core"
                                />
                                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Key // Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-slate-600 py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 font-mono"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-xs font-mono flex items-center gap-2">
                            <Terminal className="w-3 h-3" />
                            ERROR: {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all flex items-center justify-center gap-2 group/btn"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                {mode === 'login' ? 'Authenticate' : 'Register Identity'}
                                <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                            </>
                        )}
                    </button>

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-[10px] text-slate-500 hover:text-white uppercase tracking-wider transition-colors"
                        >
                            {mode === 'login' ? 'Request New Access' : 'Return to Login'}
                        </button>

                        {/* Hidden Dev Bypass triggered by hidden sequence or just explicit for now since it's a dev tool */}
                        <button
                            type="button"
                            onClick={handleDevBypass}
                            className="text-[10px] text-slate-700 hover:text-amber-800 uppercase tracking-wider transition-colors font-mono"
                        >
                            [DEV_BYTE_OVERRIDE]
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default LoginModal
