
import './App.css'
import { Header } from './components/layout/header'
import TrustVaultPage from './components/trustvault'
import { Toaster } from 'sonner' // Import Toaster from sonner
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Footer } from './components/layout/footer' 

function App() {

  return (
    <Router>
     <Routes>
       <Route path="/" element={<>
       <Header/><TrustVaultPage />
       <Footer/>
       </>} />
       {/* Add other routes here if needed */}
     </Routes>
     <Toaster richColors position="top-right" /> {/* Add the Toaster component here */}
</Router>
  )
}

export default App
