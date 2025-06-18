import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import AppSidebar from "./_components/AppSidebar";

type Props = {
  children: React.ReactNode;
};

const layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="m-2 w-full">
        <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar p-2 px-4 shadow">
          {/* <Searchbar /> */}
          <SidebarTrigger />
          <div className="ml-auto"> </div>
          <UserButton />
        </div>
        <div className="h-4"> </div>
        {/* MAIN-CONTENT */}
        <div className="h-[calc(100vh-6rem)] overflow-y-scroll rounded-md border border-sidebar-border bg-sidebar p-4 shadow">
          {" "}
          {/* overflow-y-scroll */}
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default layout;
