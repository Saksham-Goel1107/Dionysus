'use client';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import { Crown } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const TeamMembers = () => {
  const { projectId, project } = useProject();
  const { data: members } = api.project.getTeamMembers.useQuery({ projectId });
  const users = members || [];
  return (
    <div className="flex items-center gap-2">
      {users?.map((member) => {
        const user = (member as any).user ?? member;
        return (
          <div key={member.id} className="relative group">
            <a href={`mailto:${user.emailAddress}`}>
              <div className="relative">
                <Image
                  key={member.id}
                  src={user.imageUrl || ''}
                  alt={user.firstName || ''}
                  height={30}
                  width={30}
                  className="rounded-full"
                />
                {user.isPro && (
                  <span className="absolute -top-2.5 -right-1 text-yellow-400" title="Prenium User">
                    <Crown
                      className="md:w-5 md:h-5 w-4 h-4 text-yellow-400 drop-shadow"
                      fill="#facc15"
                    />
                  </span>
                )}
              </div>
            </a>
            <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-full transform rounded bg-black px-2 py-1 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
              {user.emailAddress || 'No Email'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamMembers;
