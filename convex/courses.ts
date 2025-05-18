import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const createCourse = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const courseId = await ctx.db.insert("courses", {
      name: args.name,
      description: args.description,
      userId,
      isCollapsed: false,
    });
    return courseId;
  },
});

export const getCourseProgress = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    const totalLessons = await ctx.db
      .query("lessons")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      completed: lessons.length,
      total: totalLessons.length,
      percentage: totalLessons.length > 0 ? (lessons.length / totalLessons.length) * 100 : 0
    };
  },
});

export const listCourses = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const importFromCSV = action({
  args: {
    courseName: v.string(),
    csvContent: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"courses">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const lines = args.csvContent.split("\n");
    if (lines.length < 2) throw new Error("CSV must have at least one section or lesson");
    
    const courseId = await ctx.runMutation(api.courses.createCourse, {
      name: args.courseName,
    }) as Id<"courses">;

    let currentSection: Id<"sections"> | null = null;
    let sectionOrder = 0;
    let lessonOrder = 0;

    for (const line of lines.slice(1)) {
      const [type, name] = line.split(",").map(s => s?.trim()).filter(Boolean);
      if (!type || !name) continue;

      const lowerType = type.toLowerCase();
      if (lowerType === "section") {
        currentSection = await ctx.runMutation(api.sections.createSection, {
          courseId,
          name,
          order: sectionOrder++,
        });
        lessonOrder = 0;
      } else if (lowerType === "lesson" && currentSection) {
        await ctx.runMutation(api.lessons.createLesson, {
          sectionId: currentSection,
          name,
          order: lessonOrder++,
        });
      }
    }
    
    if (!currentSection) throw new Error("CSV must contain at least one section");
    return courseId;
  },
});
