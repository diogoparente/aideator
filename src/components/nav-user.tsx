"use client"

import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react"
import { useCallback, useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Hook to get authenticated user data
export function useUser() {
  const [user, setUser] = useState<{
    id: string
    name: string
    email: string
    avatar: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Create a stable supabase client reference
  const supabaseClient = useMemo(() => createClient(), [])

  // Keep track of last fetch time to debounce requests
  const lastFetchRef = useRef<number>(0)

  const fetchUserData = useCallback(async (force = false) => {
    // Debounce fetches that happen close together (within 2 seconds)
    const now = Date.now()
    if (!force && now - lastFetchRef.current < 2000) {
      return
    }

    lastFetchRef.current = now

    try {
      // Get authenticated user
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()


      if (authError || !authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()


      if (profileError) {
        setUser(null)
        setLoading(false)
        return
      }

      const userData = {
        id: authUser.id,
        name: profile?.full_name || authUser.user_metadata?.full_name || "Unknown User",
        email: authUser.email || "",
        avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || "",
      }

      setUser(userData)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabaseClient])

  useEffect(() => {
    // Initial fetch
    fetchUserData(true)

    // Track visibility changes to only fetch when needed
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Only fetch if the tab becomes visible and we already have a user
        fetchUserData()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      // Only fetch on meaningful auth events
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        fetchUserData(true) // Force update on important auth events
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      subscription.unsubscribe()
    }
  }, [fetchUserData, supabaseClient])

  const signOut = async () => {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  return { user, loading, signOut }
}

export function NavUser() {
  const { user, loading, signOut } = useUser()
  const { isMobile } = useSidebar()
  const router = useRouter()

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
              <span className="truncate text-xs text-muted-foreground">
                Please wait
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => router.push('/login')}
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">?</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Not signed in</span>
              <span className="truncate text-xs text-muted-foreground">
                Click to sign in
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserCircleIcon className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
