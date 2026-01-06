'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

interface TriggerLog {
  time: string;
  event: string;
  details: string;
}

export default function WidgetTestPage() {
  const [logs, setLogs] = useState<TriggerLog[]>([]);
  const [triggerConfig, setTriggerConfig] = useState({
    exit_intent: { enabled: true, threshold: 50 },
    time_on_page: { enabled: true, delay_seconds: 5 }, // 5 seconds for testing
    cart_abandonment: { enabled: true },
    scroll_depth: { enabled: true, threshold: 70 }
  });
  const [widgetInitialized, setWidgetInitialized] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (event: string, details: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, event, details }]);
  };

  // Listen for widget events
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'limina_event') {
        addLog(e.data.event, JSON.stringify(e.data.data || {}));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Monitor mouse position for exit intent visualization
  const [mouseY, setMouseY] = useState<number | null>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Monitor scroll position
  const [scrollPercent, setScrollPercent] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const percent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      setScrollPercent(Math.max(0, Math.min(100, percent)));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const initializeWidget = () => {
    if (!widgetContainerRef.current) return;

    // Clear any existing widget
    widgetContainerRef.current.innerHTML = '';

    // Clear session storage to allow re-triggering
    sessionStorage.clear();
    localStorage.removeItem('limina_cart_state');

    // Initialize widget with test config
    if (typeof window !== 'undefined' && (window as any).Limina) {
      (window as any).Limina.createWidget(widgetContainerRef.current, {
        productId: 'test-product-123',
        merchantId: 'test-merchant-456',
        currentPrice: 99.99,
        currency: 'USD',
        config: {
          triggers: triggerConfig,
          display: {
            collapsed_text: 'Want a better price? Set your target',
            expanded_text: 'Get notified when this drops to your price'
          }
        }
      });
      setWidgetInitialized(true);
      addLog('INIT', 'Widget initialized with config: ' + JSON.stringify(triggerConfig));
    }
  };

  const forceShowWidget = () => {
    if (!widgetContainerRef.current) return;

    // Clear any existing widget
    widgetContainerRef.current.innerHTML = '';

    if (typeof window !== 'undefined' && (window as any).Limina) {
      (window as any).Limina.showWidgetNow(widgetContainerRef.current, {
        productId: 'test-product-123',
        merchantId: 'test-merchant-456',
        currentPrice: 99.99,
        currency: 'USD',
        config: { triggers: triggerConfig }
      });
      addLog('FORCE_SHOW', 'Widget force-shown immediately');
    }
  };

  const simulateCartAbandonment = () => {
    // Set cart state as if user left 10 minutes ago
    localStorage.setItem('limina_cart_state', JSON.stringify({
      hasItems: true,
      leftAt: Date.now() - (10 * 60 * 1000), // 10 minutes ago
      productId: 'test-product-123'
    }));
    addLog('SIMULATE', 'Cart abandonment state set. Refresh page or reinitialize widget.');
  };

  const clearStorage = () => {
    sessionStorage.clear();
    localStorage.removeItem('limina_cart_state');
    addLog('CLEAR', 'Cleared all Limina storage');
  };

  return (
    <div className="min-h-[200vh] bg-gray-50">
      {/* Embed script */}
      <Script src="/embed.js" strategy="afterInteractive" />

      {/* Debug Panel - Fixed to top right */}
      <div className="fixed top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="font-semibold text-gray-900">Trigger Debug Panel</h3>
        </div>

        {/* Live Stats */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Mouse Y Position:</span>
            <span className={`font-mono ${mouseY !== null && mouseY < triggerConfig.exit_intent.threshold ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
              {mouseY ?? 'N/A'}px
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Exit Intent Threshold:</span>
            <span className="font-mono text-gray-900">{triggerConfig.exit_intent.threshold}px</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Scroll Depth:</span>
            <span className={`font-mono ${scrollPercent >= triggerConfig.scroll_depth.threshold ? 'text-green-600 font-bold' : 'text-gray-900'}`}>
              {scrollPercent}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Scroll Threshold:</span>
            <span className="font-mono text-gray-900">{triggerConfig.scroll_depth.threshold}%</span>
          </div>
        </div>

        {/* Trigger Config */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">Trigger Configuration</h4>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={triggerConfig.exit_intent.enabled}
              onChange={(e) => setTriggerConfig(prev => ({
                ...prev,
                exit_intent: { ...prev.exit_intent, enabled: e.target.checked }
              }))}
              className="rounded"
            />
            <span className="text-sm">Exit Intent</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={triggerConfig.time_on_page.enabled}
              onChange={(e) => setTriggerConfig(prev => ({
                ...prev,
                time_on_page: { ...prev.time_on_page, enabled: e.target.checked }
              }))}
              className="rounded"
            />
            <span className="text-sm">Time on Page ({triggerConfig.time_on_page.delay_seconds}s)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={triggerConfig.cart_abandonment.enabled}
              onChange={(e) => setTriggerConfig(prev => ({
                ...prev,
                cart_abandonment: { ...prev.cart_abandonment, enabled: e.target.checked }
              }))}
              className="rounded"
            />
            <span className="text-sm">Cart Abandonment</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={triggerConfig.scroll_depth.enabled}
              onChange={(e) => setTriggerConfig(prev => ({
                ...prev,
                scroll_depth: { ...prev.scroll_depth, enabled: e.target.checked }
              }))}
              className="rounded"
            />
            <span className="text-sm">Scroll Depth (70%)</span>
          </label>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <button
            onClick={initializeWidget}
            className="w-full px-3 py-2 bg-yellow-500 text-white text-sm font-medium rounded hover:bg-yellow-600 transition"
          >
            Initialize Widget
          </button>
          <button
            onClick={forceShowWidget}
            className="w-full px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition"
          >
            Force Show Widget
          </button>
          <button
            onClick={simulateCartAbandonment}
            className="w-full px-3 py-2 bg-purple-500 text-white text-sm font-medium rounded hover:bg-purple-600 transition"
          >
            Simulate Cart Abandonment
          </button>
          <button
            onClick={clearStorage}
            className="w-full px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 transition"
          >
            Clear Storage
          </button>
        </div>

        {/* Event Log */}
        <div className="p-4">
          <h4 className="font-medium text-gray-700 text-sm mb-2">Event Log</h4>
          <div className="space-y-1 max-h-48 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-xs italic">No events yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-xs font-mono bg-gray-50 p-2 rounded">
                  <span className="text-gray-400">{log.time}</span>
                  <span className="text-blue-600 ml-2 font-bold">{log.event}</span>
                  <div className="text-gray-600 truncate">{log.details}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Exit Intent Zone Indicator */}
      <div
        className="fixed top-0 left-0 right-0 h-[50px] bg-red-500/10 border-b-2 border-dashed border-red-400 z-40 pointer-events-none"
        style={{ height: triggerConfig.exit_intent.threshold }}
      >
        <div className="absolute bottom-2 left-4 text-xs text-red-600 font-medium">
          Exit Intent Zone (mouse here to trigger)
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto pt-20 pb-32 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Widget Trigger Test Page</h1>
        <p className="text-gray-600 mb-8">
          Test the smart widget triggers by interacting with this page.
        </p>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Test Triggers</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">1</span>
              <span>Click &quot;Initialize Widget&quot; in the debug panel</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">2</span>
              <span><strong>Exit Intent:</strong> Move your mouse to the red zone at the top of the page</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">3</span>
              <span><strong>Time on Page:</strong> Wait 5 seconds after initializing</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">4</span>
              <span><strong>Scroll Depth:</strong> Scroll down past 70%, then scroll back up</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">5</span>
              <span><strong>Cart Abandonment:</strong> Click &quot;Simulate Cart Abandonment&quot;, then &quot;Initialize Widget&quot;</span>
            </li>
          </ol>
        </div>

        {/* Fake Product Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-gray-500 text-lg">Product Image</span>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Premium Widget Pro</h2>
                <p className="text-gray-500 text-sm">Model: WGT-2024-PRO</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">$99.99</p>
                <p className="text-sm text-gray-500">Free shipping</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              The ultimate widget for all your needs. Features include advanced functionality,
              premium materials, and a 2-year warranty.
            </p>

            <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition mb-4">
              Add to Cart - $99.99
            </button>

            {/* Widget Container */}
            <div
              ref={widgetContainerRef}
              className="mt-4"
              data-testid="widget-container"
            >
              {!widgetInitialized && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400">
                  <p>Widget will appear here when triggered</p>
                  <p className="text-sm mt-1">Click &quot;Initialize Widget&quot; to start</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Content - Makes page scrollable */}
        <div className="mt-16 space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Product Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li>High-quality construction</li>
              <li>5-year warranty</li>
              <li>24/7 customer support</li>
              <li>Free returns within 30 days</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Customer Reviews</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex gap-1 text-yellow-400 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s}>&#9733;</span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Great product! Exactly what I was looking for. Highly recommended.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Shipping Information</h3>
            <p className="text-gray-600">
              Free standard shipping on all orders. Express shipping available for $9.99.
              Orders placed before 2 PM ship same day.
            </p>
          </div>

          {/* Scroll depth marker */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-medium">
              You&apos;ve scrolled past 70%!
            </p>
            <p className="text-green-600 text-sm">
              Scroll back up to trigger the scroll_depth event.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">FAQ</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">What is the return policy?</p>
                <p className="text-gray-600 text-sm">30-day no-questions-asked returns.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Do you ship internationally?</p>
                <p className="text-gray-600 text-sm">Yes, we ship to over 50 countries.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
