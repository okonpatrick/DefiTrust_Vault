
import './App.css'
import { Header } from './components/layout/header'
import TrustVaultPage from './components/trustvault'
import { Toaster } from 'sonner' // Import Toaster from sonner
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Footer } from './components/layout/footer' 
import LandingPage from './pages/landingpage'
import { TermsOfServicePage } from "./pages/TermsOfServicePage"; // Added import
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage"; // Added import
import { FaqPage } from "./pages/FaqPage"; // Added import
import { EndorsersPage } from "./pages/EndorsersPage"; // Added import
import { ScrollToTop } from './utils/ScrollToTop'; // Import the new component

function App() {

  return (
    <Router>
            <ScrollToTop />
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

       <Route path="/terms" element={<div className="bg-black">
         <Header/>
         <TermsOfServicePage />
         <Footer/>
       </div>} />

       <Route path="/privacy" element={<div className="bg-black">
         <Header/>
         <PrivacyPolicyPage />
         <Footer/>
       </div>} />
       
       <Route path="/faq" element={<div className="bg-black">
         <Header/>
         <FaqPage />
         <Footer/>
       </div>} />

       <Route path="/endorsers" element={<div className="bg-black">
         <Header/>
         <EndorsersPage />
         <Footer/>
       </div>} />
     </Routes>

     <Toaster richColors position="top-right" /> {/* Add the Toaster component here */}
</Router>
  )
}

export default App
