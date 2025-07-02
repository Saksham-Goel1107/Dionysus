import { clerkClient } from "@clerk/nextjs/server";
import { StreamChat } from "stream-chat";

export async function POST(request: Request) {
  const apiKey = process.env.STREAM_API_KEY ?? '';
  const apiSecret = process.env.STREAM_API_SECRET ?? '';

 const serverClient = StreamChat.getInstance(apiKey, apiSecret);
 const user = await request.json()
 const token =serverClient.createToken(user.data.id)
 const client = await clerkClient()
 await serverClient.upsertUser({id:user.data.id})
 await client.users.updateUserMetadata(user.data.id,{
    publicMetadata:{
        token:token
    }
 })

 const slugs = ["General","Help","Showcase","Random"]
 slugs.forEach(async(item) => {
    const channel = serverClient.channel('messaging', slug, {
      image: 'https://getstream.io/random_png/?name=react',
      name: slug,
      created_by_id:user.data.id
    });
    await channel.create()
    channel.addMembers([user:user.data.id])
 });

return Response.json({message:"hi"})

}