
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Collection", path: "/collection" },
    { name: "Stake", path: "/stake" },
    { name: "Faucet", path: "/faucet" },
    { name: "Roadmap", path: "/roadmap" },
  ];

  return (
    <nav className="bg-black/90 backdrop-blur-sm border-b border-nordic-gold/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/valhalla-logo.png"
              alt="Valhalla Logo"
              className="h-8 w-8"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-cinzel font-bold text-xl text-nordic-gold">
              VALHALLA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`font-cinzel font-medium transition-colors ${
                  location === item.path
                    ? "text-nordic-gold"
                    : "text-gray-300 hover:text-nordic-gold"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-nordic-gold"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/95 backdrop-blur-sm">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`block px-3 py-2 font-cinzel font-medium transition-colors ${
                    location === item.path
                      ? "text-nordic-gold"
                      : "text-gray-300 hover:text-nordic-gold"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
