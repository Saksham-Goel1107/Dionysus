import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

type Props = {
  params: { projectId: string; inviteToken: string };
};

const JoinHandlerWithToken = async (props: Props) => {
  const { projectId, inviteToken } = await props.params;
  const { userId } = await auth();

  if (!userId) return redirect('/sign-in');
  if (!projectId) return redirect('/dashboard?error=Missing+project+ID');
  if (!inviteToken) return redirect('/dashboard?error=Missing+invite+token');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const dbUser = await db.user.findUnique({
    where: { id: userId },
  });

  const existingUserByEmail = await db.user.findUnique({
    where: { emailAddress: user.emailAddresses[0]!.emailAddress },
  });

  if (!dbUser && !existingUserByEmail) {
    await db.user.create({
      data: {
        id: userId,
        emailAddress: user.emailAddresses[0]!.emailAddress,
        imageUrl: user.imageUrl,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      inviteToken: true,
    },
  });

  if (!project) return redirect('/dashboard?error=Project+not+found');

  if (project.inviteToken !== inviteToken) {
    return redirect(
      '/dashboard?error=Invalid+invite+link.+The+link+may+have+been+regenerated+by+the+project+creator.',
    );
  }

  let existingUserProject = null;
  try {
    existingUserProject = await db.userToProject.findFirst({
      where: {
        userId,
        projectId,
      },
    });
  } catch (findError) {
    console.error('Error checking existing membership:', findError);
  }

  if (existingUserProject) {
    return redirect('/dashboard?successAlready+a+member+of+this+project');
  }

  try {
    await db.userToProject.create({
      data: {
        userId,
        projectId,
      },
    });
  } catch (error: any) {
    console.error('Failed to join project:', {
      userId,
      projectId,
      error,
    });
    if (
      error.code === 'P2002' ||
      (typeof error.message === 'string' &&
        (error.message.includes('Unique constraint') ||
          error.message.includes('duplicate key') ||
          error.message.includes('already exists')))
    ) {
      return redirect('/dashboard?info=Already+a+member+of+this+project');
    }
    return redirect('/dashboard?error=Failed+to+join+project');
  }
  return redirect('/dashboard?success=Joined+project+successfully');
};

export default JoinHandlerWithToken;
