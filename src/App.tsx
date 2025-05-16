
import './App.css'
import TrustVaultPage from './components/trustvault'
import { Toaster } from 'sonner' // Import Toaster from sonner

function App() {

  return (
    <>
     <TrustVaultPage /> 
     <Toaster richColors position="top-right" /> {/* Add the Toaster component here */}

    </>
  )
}

export default App
