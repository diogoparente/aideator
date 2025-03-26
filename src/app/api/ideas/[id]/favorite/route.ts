import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { toggleFavorite } from "@/lib/services/ideas";
import type { Database } from "@/lib/supabase/database.types";

// PATCH /api/ideas/[id]/favorite - Toggle favorite status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Get the supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the idea ID from the path
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Idea ID is required" },
        { status: 400 },
      );
    }

    // Toggle the favorite status
    const updatedIdea = await toggleFavorite(id);

    if (!updatedIdea) {
      return NextResponse.json(
        { error: "Failed to toggle favorite status" },
        { status: 500 },
      );
    }

    // Return the updated idea
    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error("Error toggling favorite status:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite status" },
      { status: 500 },
    );
  }
}
