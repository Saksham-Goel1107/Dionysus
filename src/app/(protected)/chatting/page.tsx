'use client';

import React from 'react';

const ChattingPage = () => {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">Select a channel</h1>
      <p className="text-gray-500 dark:text-gray-400">
        Choose a channel from the sidebar to join the conversation.
      </p>
    </div>
  );
};

export default ChattingPage;
