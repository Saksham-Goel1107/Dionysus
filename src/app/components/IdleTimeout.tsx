'use client';

import React, { useState, useEffect } from 'react';

const IdleTimeout = () => {
  const [idleWarning, setIdleWarning] = useState(false);
  
  useEffect(() => {
    let idleTimer: NodeJS.Timeout | null = null;
    let warningTimer: NodeJS.Timeout | null = null;
    
    const resetIdle = () => {
      setIdleWarning(false);
      if (idleTimer) clearTimeout(idleTimer);
      if (warningTimer) clearTimeout(warningTimer);
      
      // Set warning timer (e.g., after 25 minutes of inactivity)
      warningTimer = setTimeout(() => {
        setIdleWarning(true);
      }, 25 * 60 * 1000);
      
      // Set idle timer (e.g., after 30 minutes of inactivity)
      idleTimer = setTimeout(() => {
        // Redirect to logout or perform logout action
        window.location.href = '/sign-out';
      }, 30 * 60 * 1000);
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetIdle, true);
    });
    
    // Initialize timers
    resetIdle();
    
    // Cleanup
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (warningTimer) clearTimeout(warningTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdle, true);
      });
    };
  }, []);
  
  const handleContinueSession = () => {
    setIdleWarning(false);
  };
  
  if (!idleWarning) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Session Timeout Warning</h2>
        <p className="text-gray-600 mb-4">
          Your session will expire soon due to inactivity. Would you like to continue?
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleContinueSession}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Continue Session
          </button>
          <button
            onClick={() => window.location.href = '/sign-out'}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdleTimeout;