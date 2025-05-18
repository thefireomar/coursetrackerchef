import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  courses: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    isCollapsed: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),
  
  sections: defineTable({
    courseId: v.id("courses"),
    name: v.string(),
    order: v.number(),
    userId: v.id("users"),
    isCollapsed: v.optional(v.boolean()),
  })
    .index("by_course", ["courseId", "order"])
    .index("by_user", ["userId"]),
  
  lessons: defineTable({
    sectionId: v.id("sections"),
    name: v.string(),
    order: v.number(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    userId: v.id("users"),
  })
    .index("by_section", ["sectionId", "order"])
    .index("by_user", ["userId"])
    .index("by_user_and_completion", ["userId", "completed"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
