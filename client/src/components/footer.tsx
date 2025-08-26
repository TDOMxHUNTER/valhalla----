
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-black/90 border-t border-nordic-gold/20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
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
            </div>
            <p className="text-gray-300 max-w-md">
              Enter the realm of legendary Viking warriors. Collect, stake, and conquer in the most epic NFT adventure ever created.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="https://discord.gg/WXES52DTUU"
                className="text-nordic-gold hover:text-yellow-500 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-discord text-2xl"></i>
              </a>
              <a
                href="https://x.com/Valhalla__xyz"
                className="text-nordic-gold hover:text-yellow-500 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-twitter text-2xl"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-cinzel font-bold text-white text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-nordic-gold transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/collection" className="text-gray-300 hover:text-nordic-gold transition-colors">
                  Collection
                </Link>
              </li>
              <li>
                <Link href="/stake" className="text-gray-300 hover:text-nordic-gold transition-colors">
                  Stake
                </Link>
              </li>
              <li>
                <Link href="/faucet" className="text-gray-300 hover:text-nordic-gold transition-colors">
                  Faucet
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-cinzel font-bold text-white text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/roadmap" className="text-gray-300 hover:text-nordic-gold transition-colors">
                  Roadmap
                </Link>
              </li>
              <li>
                <a href="https://discord.gg/WXES52DTUU" className="text-gray-300 hover:text-nordic-gold transition-colors" target="_blank" rel="noopener noreferrer">
                  Join Discord
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-nordic-gold transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-nordic-gold transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-nordic-gold/20 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 Valhalla NFT. All rights reserved. May the gods guide your journey.
          </p>
        </div>
      </div>
    </footer>
  );
}
