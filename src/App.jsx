import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Player from './pages/Player'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Player />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
