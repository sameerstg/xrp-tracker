import XRPTracker from "./components/XRPTracker";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black p-4">
      <main className="flex flex-col items-center gap-8 w-full max-w-4xl">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Crypto Price Tracker
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Real-time XRP price updates powered by Binance API
          </p>
        </div>
        
        <XRPTracker />
        
        <footer className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-8">
          <p>Data provided by Binance WebSocket API</p>
        </footer>
      </main>
    </div>
  );
}
