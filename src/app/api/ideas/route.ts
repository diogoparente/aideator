import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getIdeasByUser, createIdea } from "@/lib/services/ideas";
import type { Database } from "@/lib/supabase/database.types";
import { NewIdea } from "@/lib/db/schema";

// GET /api/ideas - Get all ideas for the current user
export async function GET(request: Request) {
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

    // Get all ideas for the user
    const ideas = await getIdeasByUser(userId);

    // Return the ideas
    return NextResponse.json(ideas);
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 },
    );
  }
}

// POST /api/ideas - Create a new idea
export async function POST(request: Request) {
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

    // Parse the request body
    const body = await request.json();

    // Create the new idea object
    const newIdeaData: NewIdea = {
      userId,
      title: body.title,
      description: body.description,
      isFavorite: body.isFavorite ?? false,
    };

    // Create the idea
    const newIdea = await createIdea(newIdeaData);

    // Return the created idea
    return NextResponse.json(newIdea, { status: 201 });
  } catch (error) {
    console.error("Error creating idea:", error);
    return NextResponse.json(
      { error: "Failed to create idea" },
      { status: 500 },
    );
  }
}
