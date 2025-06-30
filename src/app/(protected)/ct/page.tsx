"use client"
import { useState, useEffect } from 'react';
import 'stream-chat-react/dist/css/v2/index.css';
import './layout.css';
import type { User, Channel as StreamChannel } from 'stream-chat';
import { useCreateChatClient, Chat, Channel, ChannelHeader, MessageInput, MessageList, Thread, Window } from 'stream-chat-react';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';
const userId = process.env.NEXT_PUBLIC_STREAM_USER_ID || '';
const userName = process.env.NEXT_PUBLIC_STREAM_USER_NAME || '';
const userToken = process.env.NEXT_PUBLIC_STREAM_USER_TOKEN || '';

const user: User = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const App = () => {
  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useEffect(() => {
    if (!client) return;

    const channel = client.channel('messaging', 'custom_channel_id', {
      image: 'https://getstream.io/random_png/?name=react',
      name: 'Talk about React',
      members: [userId],
    });

    setChannel(channel);
  }, [client]);

  if (!client) return <div>Setting up client & connection...</div>;

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

export default App;