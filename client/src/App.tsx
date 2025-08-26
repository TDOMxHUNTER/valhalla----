
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/components/web3-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import Collection from "@/pages/collection";
import Stake from "@/pages/stake";
import Faucet from "@/pages/faucet";
import Roadmap from "@/pages/roadmap";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "react-error-boundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-viking-dark flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Something went wrong</h1>
        <p className="text-gray-300 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-nordic-gold text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ThemeProvider defaultTheme="dark" storageKey="valhalla-ui-theme">
            <div className="min-h-screen bg-viking-dark text-white">
              <Navigation />
              <main>
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/collection" component={Collection} />
                  <Route path="/stake" component={Stake} />
                  <Route path="/faucet" component={Faucet} />
                  <Route path="/roadmap" component={Roadmap} />
                  <Route component={NotFound} />
                </Switch>
              </main>
              <Footer />
              <Toaster />
            </div>
          </ThemeProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
