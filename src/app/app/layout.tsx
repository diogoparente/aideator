import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger, SidebarContent } from "@/components/ui/sidebar";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <AppSidebar />
        <SidebarTrigger />
      </div>

      {/* Main content */}
      <div className="flex-grow overflow-auto">
        <div className="w-full max-w-4xl mx-auto mb-8 sm:max-w-6xl sm:mx-auto md:max-w-8xl md:mx-auto lg:max-w-10xl lg:mx-auto p-4">
          <div className="flex flex-col h-full">
            <main className="flex-1">
              <SidebarContent>{children}</SidebarContent>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
