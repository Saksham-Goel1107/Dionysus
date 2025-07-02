'use client';

import React from 'react';

const ChattingPage = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center min-h-[60vh]">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Select a channel</h1>
      <p className="text-gray-500 dark:text-gray-400">
        Choose a channel from the sidebar to join the conversation.
      </p>
    </div>
  );
};

export default ChattingPage;
