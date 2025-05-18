import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createLesson = mutation({
  args: {
    sectionId: v.id("sections"),
    name: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("lessons", {
      sectionId: args.sectionId,
      name: args.name,
      order: args.order,
      completed: false,
      userId,
    });
  },
});

export const toggleComplete = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson || lesson.userId !== userId) throw new Error("Lesson not found");

    const completed = !lesson.completed;
    
    await ctx.db.patch(args.lessonId, {
      completed,
      completedAt: completed ? Date.now() : undefined,
    });
  },
});

export const getLessons = query({
  args: {
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("lessons")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .order("asc")
      .collect();
  },
});
