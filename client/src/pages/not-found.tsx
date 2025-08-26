import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Shield } from "lucide-react";

export default function NotFound() {
  return (
    <section className="py-20 min-h-screen page-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8">
          <Shield className="h-24 w-24 text-nordic-gold mx-auto mb-6 opacity-50" />
        </div>

        <h1 className="font-cinzel font-bold text-6xl md:text-8xl text-white mb-6">
          4<span className="text-nordic-gold">0</span>4
        </h1>

        <h2 className="font-cinzel font-bold text-3xl text-nordic-gold mb-6">
          Page Not Found
        </h2>

        <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
          The path you seek has been lost to the mists of time. Even the most skilled Viking warriors cannot find it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button
              className="bg-nordic-gold text-black hover:bg-yellow-500 font-bold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
            >
              <Home className="mr-2 h-5 w-5" />
              Return to Valhalla
            </Button>
          </Link>

          <Button
            variant="outline"
            className="border-nordic-gold text-nordic-gold hover:bg-nordic-gold hover:text-black font-bold px-8 py-3 rounded-lg"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>

        <div className="mt-12 text-gray-400">
          <p>Lost? Join our Discord community for guidance</p>
          <a
            href="https://discord.gg/valhalla"
            className="text-nordic-gold hover:text-yellow-500 transition-colors inline-flex items-center mt-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-discord mr-2"></i>
            Join Discord
          </a>
        </div>
      </div>
    </section>
  );
}