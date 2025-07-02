import { currentUser } from '@clerk/nextjs/server'
import ChatClient from '../_components/Chat'

export default async function Page({ params }: { params: { slug: string } }) {
const user = await currentUser()
  if(!user){
    return new Response("Unauthorized",{status:401})
  }
  const { slug } = await params
  return <ChatClient clerkUser={{id:user.id,name:user.firstName ?? "",token: String(user.publicMetadata.token ?? "")}} slug={slug}/>
}
