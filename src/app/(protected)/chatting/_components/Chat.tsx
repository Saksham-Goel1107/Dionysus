'use client';
import React, { useState, useEffect } from 'react';
import type { User, Channel as StreamChannel } from 'stream-chat';
import {
  useCreateChatClient,
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';

import 'stream-chat-react/dist/css/v2/index.css';

interface ChatClientProps {
  clerkUser: { id: string; name: string; token: string };
  slug: string;
}

const ChatClient = ({ clerkUser, slug }: ChatClientProps) => {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<StreamChannel | undefined>();
  
  if (!apiKey) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Configuration Error</h2>
        <p>Chat service is not properly configured. Please contact support.</p>
      </div>
    );
  }

  if (!clerkUser.token) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
        <p>Could not authenticate with chat service. Missing user token.</p>
      </div>
    );
  }

  const user: User = {
    id: clerkUser.id,
    name: clerkUser.name,
    image: `https://getstream.io/random_png/?name=${encodeURIComponent(clerkUser.name)}`,
  };

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: clerkUser.token,
    userData: user,
  });

  useEffect(() => {
    if (!client) return;
    
    try {
      const newChannel = client.channel('messaging', slug, {
        image: `https://getstream.io/random_png/?name=${encodeURIComponent(slug)}`,
        name: slug,
      });
      
      setChannel(newChannel);
      
      // Handle connection error
      const handleClientError = (event: any) => {
        console.error('Stream client error:', event);
        setError('Failed to connect to chat service. Please try again later.');
      };
      
      client.on('connection.error', handleClientError);
      
      return () => {
        client.off('connection.error', handleClientError);
      };
    } catch (err) {
      console.error('Error setting up channel:', err);
      setError('Failed to set up chat channel.');
    }
  }, [client, slug]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Chat Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">Setting up chat connection...</p>
      </div>
    );
  }

  return (
    <Chat client={client}>
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
};

export default ChatClient;
