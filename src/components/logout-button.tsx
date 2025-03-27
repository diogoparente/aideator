import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error.message);
        return;
      }

      // Clear any client-side state/cache if needed
      router.refresh(); // Refresh server components
      // launch toaster success message
      toast.success("Logged out successfully");
      // redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error("Unexpected error during logout:", err);
    }
  };

  return (
    <Button
      variant="destructive"
      className="flex-1 w-full cursor-pointer"
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
