"use client";
import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";

const TeamMembers = () => {
  const { projectId } = useProject();
  const { data: members } = api.project.getTeamMembers.useQuery({ projectId });
  return (
    <div className="flex items-center gap-2">
      {members?.map((member) => (
        <div key={member.id} className="relative group">
          <img
            key={member.id}
            src={member.user.imageUrl || ""}
            alt={member.user.firstName || ""}
            height={30}
            width={30}
            className="rounded-full"
          />
          <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-full transform rounded bg-black px-2 py-1 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
            {member.user.emailAddress || "No Email"}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamMembers;
