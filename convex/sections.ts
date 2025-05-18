import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createSection = mutation({
  args: {
    courseId: v.id("courses"),
    name: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("sections", {
      courseId: args.courseId,
      name: args.name,
      order: args.order,
      userId,
      isCollapsed: false,
    });
  },
});

export const toggleCollapsed = mutation({
  args: {
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.userId !== userId) throw new Error("Section not found");

    await ctx.db.patch(args.sectionId, {
      isCollapsed: !section.isCollapsed,
    });
  },
});

export const getSections = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("sections")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .order("asc")
      .collect();
  },
});
