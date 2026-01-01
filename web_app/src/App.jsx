import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import VideoList from './VideoList'
import VideoDetail from './VideoDetail'
import ReviewSession from './ReviewSession'
import MasteryLibrary from './MasteryLibrary'

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-[#f3f1e9] text-slate-800 font-sans selection:bg-amber-200 selection:text-amber-900">
                <Routes>
                    <Route path="/" element={<VideoList />} />
                    <Route path="/video/:id" element={<VideoDetail />} />
                    <Route path="/review" element={<ReviewSession />} />
                    <Route path="/library" element={<MasteryLibrary />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
