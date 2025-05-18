
"use client";
import {Link} from "react-router-dom";
import { Button } from '@/components/ui/button';
import { MountainIcon, LogOut } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
          <MountainIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold">DeFi Trust Vault</h1>
        </Link>
        <nav className="flex items-center gap-4">
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
          {/* <ThemeToggle /> */}
          {/* {account ? ( */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary"></Badge>
              <Button variant="outline" size="icon" aria-label="Disconnect wallet">
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

      </div>
    </header>
  );
}
