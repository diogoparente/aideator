import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getIdeaById, deleteIdea, updateIdea } from "@/lib/services/ideas";
import type { Database } from "@/lib/supabase/database.types";

// GET /api/ideas/[id] - Get a specific idea
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Get the idea ID from the path
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Idea ID is required" },
        { status: 400 },
      );
    }

    // Get the idea
    const idea = await getIdeaById(id);

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Return the idea
    return NextResponse.json(idea);
  } catch (error) {
    console.error("Error fetching idea:", error);
    return NextResponse.json(
      { error: "Failed to fetch idea" },
      { status: 500 },
    );
  }
}

// DELETE /api/ideas/[id] - Delete a specific idea
export async function DELETE(
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

    // Delete the idea
    const success = await deleteIdea(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete idea" },
        { status: 500 },
      );
    }

    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting idea:", error);
    return NextResponse.json(
      { error: "Failed to delete idea" },
      { status: 500 },
    );
  }
}

// PATCH /api/ideas/[id] - Update a specific idea
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

    // Parse the request body
    const body = await request.json();

    // Update the idea
    const updatedIdea = await updateIdea(id, {
      title: body.title,
      description: body.description,
      isFavorite: body.isFavorite,
    });

    if (!updatedIdea) {
      return NextResponse.json(
        { error: "Failed to update idea" },
        { status: 500 },
      );
    }

    // Return the updated idea
    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error("Error updating idea:", error);
    return NextResponse.json(
      { error: "Failed to update idea" },
      { status: 500 },
    );
  }
}
