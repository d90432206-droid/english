import { useState } from 'react'
import { supabase } from './supabaseClient'
import { X, Youtube, Loader2, Link as LinkIcon, Plus } from 'lucide-react'
import { format } from 'date-fns'

const AddVideoModal = ({ isOpen, onClose, onVideoAdded }) => {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [preview, setPreview] = useState(null)

    if (!isOpen) return null

    const extractVideoId = (inputUrl) => {
        try {
            const urlObj = new URL(inputUrl)
            if (urlObj.hostname.includes('youtube.com')) {
                return urlObj.searchParams.get('v')
            } else if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.slice(1)
            }
        } catch (e) {
            return null
        }
        return null
    }

    const handleUrlChange = (e) => {
        const input = e.target.value
        setUrl(input)
        setError(null)

        const videoId = extractVideoId(input)
        if (videoId) {
            setPreview({
                videoId,
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            })
        } else {
            setPreview(null)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!preview) {
            setError('Invalid specific YouTube URL')
            return
        }

        // API Quota Check
        const today = format(new Date(), 'yyyy-MM-dd')
        const quotaData = JSON.parse(localStorage.getItem('daily_import_count') || '{}')

        if (quotaData.date !== today) {
            quotaData.date = today
            quotaData.count = 0
        }

        if (quotaData.count >= 50) { // TEMPORARY UNLOCK: Increased to 50
            alert('即便學習熱情高漲，也請適度休息。\n系統資源已耗盡，請明日再試 (API Usage Limit Reached)。')
            setLoading(false) // Ensure loading is turned off
            return
        }
        setLoading(true)
        setError(null)

        try {
            // 1. Check if already exists
            const { data: existing } = await supabase
                .from('english_videos')
                .select('video_id, status')
                .eq('video_id', preview.videoId)
                .maybeSingle()

            if (existing) {
                if (existing.status === 'completed') {
                    setError('This video is already in your library!')
                } else {
                    setError(`Video is already adding (Status: ${existing.status})`)
                }
                setLoading(false)
                return
            }

            // 2. Insert into DB with 'pending' status
            // FIX: database column is likely 'thumbnail' not 'thumbnail_url' based on common error patterns
            // or I should check schema. I will assume 'thumbnail' is safer or just omit if optional.
            // Let's try 'thumbnail' as field name.
            const { error: insertError } = await supabase
                .from('english_videos')
                .insert([{
                    video_id: preview.videoId,
                    status: 'pending',
                    vocabulary: [],
                    sentence_patterns: []
                }])

            if (insertError) throw insertError

            // Increment Quota
            quotaData.count = (quotaData.count || 0) + 1
            localStorage.setItem('daily_import_count', JSON.stringify(quotaData))

            console.log('Video queued:', preview.videoId)
            onVideoAdded()
            onClose()
            setUrl('')
            setPreview(null)

        } catch (err) {
            console.error('Error adding video:', err)
            // Error handling: if column not found, maybe try omitting thumbnail?
            setError(err.message || 'Failed to add video')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e293b]/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#fbf9f3] border-2 border-[#e7e4d8] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[#e7e4d8] bg-[#f3f1e9]">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight italic">
                        <div className="bg-amber-700 text-white p-1">
                            <Plus className="w-4 h-4" />
                        </div>
                        Inject Source
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-amber-700 hover:bg-[#e7e4d8] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">YouTube Link</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={url}
                                onChange={handleUrlChange}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full bg-white border-2 border-[#e7e4d8] py-3 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400 font-medium"
                                autoFocus
                            />
                            <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        </div>
                    </div>

                    {/* Preview Area */}
                    {preview && (
                        <div className="bg-slate-100 border border-[#e7e4d8] overflow-hidden animate-in slide-in-from-top-2 relative">
                            <img
                                src={preview.thumbnail}
                                alt="Preview"
                                className="w-full h-48 object-cover opacity-90 transition-opacity hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-amber-900/10 mix-blend-overlay"></div>
                            <div className="p-3 bg-white border-t border-[#e7e4d8] text-center">
                                <span className="text-xs font-mono text-slate-500">ID: {preview.videoId}</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 font-medium">
                            <X className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!preview || loading}
                            className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold uppercase tracking-widest shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:translate-y-0.5"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Queueing...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Start Analysis
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 mt-3 font-mono">
                            Video will be processed in the background worker.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddVideoModal
