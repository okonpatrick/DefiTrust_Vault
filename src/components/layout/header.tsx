import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MountainIcon, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

      const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-gray-800 text-gray-100 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex md:items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-primary/90 transition-colors"
        >
          <MountainIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold text-gray-100 hover:text-gray-100 transition-colors">
            DeFi Trust Vault
          </h1>
        </Link>
        <nav className="hidden md:flex items-center gap-4 ">
          <Button variant="ghost" asChild>
            <Link to="#trust-score">Trust Score</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="#endorse">Endorse</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="#lending-pool">Lending Pool</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="#borrow">Borrow</Link>
          </Button>

          <div className="flex items-center text-gray-800 gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Disconnect wallet"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="default"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Connect Wallet
          </Button>
        </nav>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-gray-800/95 backdrop-blur-sm z-50">
            <div className="container mx-auto px-4 py-4 flex flex-col items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="mb-8"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>

              <nav className="w-full flex flex-col md:items-center gap-2">
                <Button variant="ghost" asChild className="w-full text-center" onClick={toggleMenu}>
                  <Link to="#trust-score">Trust Score</Link>
                </Button>
                <Button variant="ghost" asChild className="w-full text-center" onClick={toggleMenu}>
                  <Link to="#endorse">Endorse</Link>
                </Button>
                <Button variant="ghost" asChild className="w-full text-center" onClick={toggleMenu}>
                  <Link to="#lending-pool">Lending Pool</Link>
                </Button>
                <Button variant="ghost" asChild className="w-full text-center" onClick={toggleMenu}>
                  <Link to="#borrow">Borrow</Link>
                </Button>

                <div className="flex flex-col gap-4 w-full mt-8">
                  <Button 
                    variant="default" 
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Connect Wallet
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-gray-800 flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-5 w-5" />
                    Disconnect
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
