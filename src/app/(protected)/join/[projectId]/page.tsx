import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { readReplicaDb2 } from '@/server/read-replica-2-db';
import { redirect } from 'next/navigation';

type Props = {
  params: { projectId: string };
  searchParams?: { inviteToken?: string };
};

const JoinHandler = async (props: Props) => {
  const { projectId } = props.params;
  const inviteToken = props.searchParams?.inviteToken;
  const { userId } = await auth();
  if (!userId) return redirect('/sign-in');
  const dbUser = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const existingUserByEmail = await readReplicaDb2.user.findUnique({
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

  const project = await readReplicaDb2.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      inviteToken: true,
    },
  });

  if (!project) return redirect('/dashboard?error=Project+not+found');

  if (!inviteToken || project.inviteToken !== inviteToken) {
    return redirect(
      '/dashboard?error=Invalid+or+missing+invite+token.+The+link+may+have+been+regenerated+by+the+project+creator.',
    );
  }

  try {
    const existingUserProject = await db.userToProject.findFirst({
      where: {
        userId,
        projectId,
      },
    });

    if (existingUserProject) {
      return redirect('/dashboard');
    }
  } catch (findError) {
    console.error('Error checking existing membership:', findError);
  }

  try {
    await db.userToProject.create({
      data: {
        userId,
        projectId,
      },
    });

    return redirect('/dashboard?success=Joined+project+successfully');
  } catch (error) {
    console.error('Error adding user to project:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);

    if (
      errorMessage.includes('Unique constraint') ||
      errorMessage.includes('duplicate key') ||
      errorMessage.includes('already exists')
    ) {
      return redirect('/dashboard?info=Already+a+member+of+this+project');
    }

    return redirect('/dashboard?error=Failed+to+join+project');
  }
};

export default JoinHandler;
