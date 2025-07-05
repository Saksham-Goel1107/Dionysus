import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react';

type Props = {
  params: Promise<{ projectId: string }>;
};

const JoinHandler = async (props: Props) => {
  const { projectId } = await props.params;
  const { userId } = await auth();
  if (!userId) return redirect('/sign-in');
  const dbUser = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Check if a user with this email already exists
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
    where: {
      id: projectId,
    },
  });

  if (!project) return redirect('/dashboard?error=Project+not+found');

  // Check if the user is already a member of this project
  const existingUserProject = await db.userToProject.findFirst({
    where: {
      userId,
      projectId,
    },
  });

  // If already a member, just redirect to dashboard
  if (existingUserProject) {
    return redirect('/dashboard');
  }

  try {
    // Add user to the project
    await db.userToProject.create({
      data: {
        userId,
        projectId,
      },
    });

    return redirect('/dashboard');
  } catch (error) {
    console.error('Error adding user to project:', error);
    return redirect('/dashboard?error=Failed+to+join+project');
  }
};

export default JoinHandler;
