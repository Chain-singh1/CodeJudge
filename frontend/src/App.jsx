import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login          from './pages/Login'
import Register       from './pages/Register'
import Problems       from './pages/Problems'
import ProblemPage    from './pages/ProblemPage'
import Contests       from './pages/Contests'
import ContestDetails from './pages/ContestDetails'
import Leaderboard    from './pages/Leaderboard'
import Profile        from './pages/Profile'
import Admin          from './pages/Admin'
import Settings       from './pages/Settings'
import Playground     from './pages/Playground'
import NotFound       from './pages/NotFound'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Problems /></ProtectedRoute>} />
          <Route path="/problem/:id" element={<ProtectedRoute><ProblemPage /></ProtectedRoute>} />
          <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
          <Route path="/contests/:id" element={<ProtectedRoute><ContestDetails /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings"    element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/playground" element={<ProtectedRoute><Playground /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
