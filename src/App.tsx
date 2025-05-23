
import './App.css'
import { Header } from './components/layout/header'
import TrustVaultPage from './components/trustvault'
import { Toaster } from 'sonner' // Import Toaster from sonner
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Footer } from './components/layout/footer' 
import LandingPage from './pages/landingpage'

function App() {

  return (
    <Router>
     <Routes>

       <Route path="/" element={<div className="bg-black">
       <Header/><LandingPage />
       <Footer/>
       </div>} />
       {/* Add other routes here if needed */}
        <Route path="/trustvault" element={<div className="bg-black">
       <Header/><TrustVaultPage />
       <Footer/>
       </div>} />
     </Routes>
     <Toaster richColors position="top-right" /> {/* Add the Toaster component here */}
</Router>
  )
}

export default App
