import { currentUser } from '@clerk/nextjs/server';
import ChatClient from '../_components/Chat';
import { redirect } from 'next/navigation';
import { StreamChat } from 'stream-chat';

export default async function Page({ params }: { params: { slug: string } }) {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const { slug } = await params;

  // Get or generate Stream Chat token
  let token = String(user.publicMetadata.token || '');

  // Initialize the server client
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('Stream API credentials missing');
    return (
      <div className="p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Configuration Error</h2>
        <p>Chat service is not properly configured. Please contact support.</p>
      </div>
    );
  }

  // Create a server client to manage channels and permissions
  const serverClient = StreamChat.getInstance(apiKey, apiSecret);

  // If token doesn't exist, create one
  if (!token) {
    try {
      token = serverClient.createToken(user.id);
    } catch (error) {
      console.error('Failed to generate Stream token:', error);
      return (
        <div className="p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Unable to load chat</h2>
          <p>There was a problem setting up your chat credentials. Please try again later.</p>
        </div>
      );
    }
  }

  // Ensure the user exists in Stream
  try {
    // Upsert the user to ensure they exist in Stream
    await serverClient.upsertUser({
      id: user.id,
      name: user.firstName ?? user.id,
      image: user.imageUrl ?? `https://getstream.io/random_png/?name=${user.firstName || user.id}`,
    });

    // Get or create the channel and add the current user as a member
    const channel = serverClient.channel('messaging', slug);

    // First try to query the channel to see if it exists
    try {
      const response = await channel.query();

      // If channel exists, add the current user as a member if not already
      if (response.channel) {
        const members = response.members || {};
        const isMember = Object.values(members).some((member: any) => member.user_id === user.id);

        if (!isMember) {
          await channel.addMembers([user.id]);
          console.log(`Added user ${user.id} to existing channel ${slug}`);
        }
      }
    } catch {
      channel.data = {
        name: slug,
        created_by_id: user.id,
      };
      await channel.create();
      await channel.addMembers([user.id]);
      console.log(`Created new channel ${slug} with user ${user.id}`);
    }
  } catch (error) {
    console.error('Error managing Stream channel:', error);
    return (
      <div className="p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Channel Error</h2>
        <p>There was a problem accessing the chat channel. Please try again later.</p>
      </div>
    );
  }

  return (
    <ChatClient
      clerkUser={{
        id: user.id,
        name: user.firstName ?? '',
        token: token,
      }}
      slug={slug}
    />
  );
}
