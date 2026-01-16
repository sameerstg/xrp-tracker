'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceData {
  price: string;
  timestamp: number;
  change24h?: number;
}

interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

export default function XRPTracker() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  
  // Payment fields
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'XRP' | 'USD'>('XRP');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        // Using Binance WebSocket API for real-time XRP/USDT price
        ws = new WebSocket('wss://stream.binance.com:9443/ws/xrpusdt@ticker');

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const currentPrice = parseFloat(data.c);
          const timestamp = data.E;
          
          setPriceData({
            price: currentPrice.toFixed(4), // Current price
            timestamp: timestamp, // Event time
            change24h: parseFloat(data.P), // 24h price change percent
          });

          // Update chart data
          setChartData((prev) => {
            const newDataPoint: ChartDataPoint = {
              time: new Date(timestamp).toLocaleTimeString(),
              price: currentPrice,
              timestamp: timestamp,
            };
            
            // Keep only last hour of data
            const oneHourAgo = timestamp - (60 * 60 * 1000);
            const updated = [...prev, newDataPoint].filter(d => d.timestamp >= oneHourAgo);
            
            // Update price range for chart scaling
            const prices = updated.map(d => d.price);
            setPriceRange({
              min: Math.min(...prices),
              max: Math.max(...prices),
            });
            
            return updated;
          });
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error');
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setError('Failed to connect');
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      setPaymentStatus('Connecting to XUMM wallet...');
      // Check if XUMM is available
      if (typeof window !== 'undefined' && (window as any).xrpAddress) {
        const address = (window as any).xrpAddress;
        setUserAddress(address);
        setWalletConnected(true);
        setPaymentStatus('Wallet connected successfully!');
        setTimeout(() => setPaymentStatus(null), 3000);
      } else {
        // For demo purposes, simulate wallet connection
        // In production, you'd integrate with XUMM SDK properly
        setPaymentStatus('Please install XUMM wallet extension or use the XUMM app');
        
        // Simulate connection for demo
        const demoAddress = 'rDemo...' + Math.random().toString(36).substring(7);
        setUserAddress(demoAddress);
        setWalletConnected(true);
        setTimeout(() => {
          setPaymentStatus('Demo wallet connected!');
          setTimeout(() => setPaymentStatus(null), 3000);
        }, 1000);
      }
    } catch (err) {
      setPaymentStatus('Failed to connect wallet');
      setTimeout(() => setPaymentStatus(null), 3000);
    }
  };

  const handlePayment = async () => {
    if (!walletConnected) {
      setPaymentStatus('Please connect your wallet first');
      setTimeout(() => setPaymentStatus(null), 3000);
      return;
    }

    if (!amount || !destinationAddress) {
      setPaymentStatus('Please enter amount and destination address');
      setTimeout(() => setPaymentStatus(null), 3000);
      return;
    }

    try {
      setPaymentStatus('Processing payment...');
      
      const xrpAmount = currency === 'USD' && priceData 
        ? (parseFloat(amount) / parseFloat(priceData.price)).toFixed(6)
        : amount;

      // In production, this would create a payment request via XUMM SDK
      // For demo, we'll simulate the payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPaymentStatus(`Payment of ${xrpAmount} XRP sent to ${destinationAddress.substring(0, 10)}...`);
      
      // Clear form
      setTimeout(() => {
        setAmount('');
        setDestinationAddress('');
        setPaymentStatus(null);
      }, 5000);
    } catch (err) {
      setPaymentStatus('Payment failed. Please try again.');
      setTimeout(() => setPaymentStatus(null), 3000);
    }
  };

  const calculateEquivalent = () => {
    if (!amount || !priceData) return '0';
    const amt = parseFloat(amount);
    if (isNaN(amt)) return '0';
    
    if (currency === 'XRP') {
      return (amt * parseFloat(priceData.price)).toFixed(2);
    } else {
      return (amt / parseFloat(priceData.price)).toFixed(6);
    }
  };

  return (
    <div className="w-full max-w-5xl rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-2xl">
      <div className="rounded-xl bg-white dark:bg-zinc-900 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              XRP
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                XRP/USDT
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Ripple</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {priceData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Current Price
                </p>
                <p className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">
                  ${priceData.price}
                </p>
              </div>

              {priceData.change24h !== undefined && (
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                    24h Change
                  </p>
                  <span
                    className={`text-3xl font-semibold ${
                      priceData.change24h >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {priceData.change24h >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(priceData.change24h).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {/* Price Chart */}
            {chartData.length > 0 && (
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                  Price Chart (Last Hour)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[priceRange.min * 0.9995, priceRange.max * 1.0005]}
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toFixed(4)}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Payment Section */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Send XRP Payment
              </h3>
              
              {/* Wallet Connection */}
              {!walletConnected ? (
                <button
                  onClick={connectWallet}
                  className="w-full mb-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-green-800 dark:text-green-300 text-sm">
                    ✓ Wallet Connected: {userAddress}
                  </p>
                </div>
              )}

              {/* Payment Status */}
              {paymentStatus && (
                <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-300 text-sm">{paymentStatus}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Amount Input with Currency Toggle */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Amount
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setCurrency(currency === 'XRP' ? 'USD' : 'XRP')}
                      className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg font-semibold text-zinc-900 dark:text-zinc-50 transition-colors min-w-[70px]"
                    >
                      {currency}
                    </button>
                  </div>
                  {amount && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      ≈ {calculateEquivalent()} {currency === 'XRP' ? 'USD' : 'XRP'}
                    </p>
                  )}
                </div>

                {/* Destination Address Input */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Destination Address
                  </label>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Send Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={!walletConnected || !amount || !destinationAddress}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  Send Payment
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Last updated:{' '}
                {new Date(priceData.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
}
