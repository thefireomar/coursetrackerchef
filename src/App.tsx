import { Authenticated, Unauthenticated, useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { useState, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Course Tracker</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function ProgressCircle({ percentage }: { percentage: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="rgb(229 231 235)"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="rgb(79 70 229)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xl font-semibold">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const courses = useQuery(api.courses.listCourses);
  const [selectedCourse, setSelectedCourse] = useState<Id<"courses"> | null>(null);
  const createCourse = useMutation(api.courses.createCourse);
  const importFromCSV = useAction(api.courses.importFromCSV);
  const [newCourseName, setNewCourseName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (loggedInUser === undefined || courses === undefined) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const courseName = file.name.replace('.csv', '');
        await importFromCSV({ courseName, csvContent: content });
        toast.success("Course imported successfully!");
      } catch (error: any) {
        console.error("Import error:", error);
        toast.error(error.message || "Failed to import course");
      }
    };
    reader.readAsText(file);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    
    try {
      await createCourse({ name: newCourseName });
      toast.success("Course created successfully!");
      setNewCourseName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Create course error:", error);
      toast.error("Failed to create course");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold accent-text mb-4">Course Tracker</h1>
        <Authenticated>
          <p className="text-xl text-slate-600">
            Welcome back, {loggedInUser?.email ?? "friend"}!
          </p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">Sign in to get started</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 items-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              New Course
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateCourse} className="flex gap-2">
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Course name"
                className="flex-1 px-4 py-2 border rounded-lg"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newCourseName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewCourseName("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Your Courses</h2>
              <div className="flex flex-col gap-2">
                {courses?.length === 0 ? (
                  <p className="text-slate-500 text-center">No courses yet. Create one to get started!</p>
                ) : (
                  courses?.map((course) => (
                    <CourseButton 
                      key={course._id}
                      course={course}
                      isSelected={selectedCourse === course._id}
                      onClick={() => setSelectedCourse(course._id)}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              {selectedCourse ? (
                <CourseView courseId={selectedCourse} />
              ) : (
                <p className="text-slate-500 text-center">Select a course to view sections</p>
              )}
            </div>
          </div>
        </div>
      </Authenticated>
    </div>
  );
}

function CourseButton({ 
  course, 
  isSelected, 
  onClick 
}: { 
  course: { _id: Id<"courses">; name: string }; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const progress = useQuery(api.courses.getCourseProgress, { courseId: course._id });

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded text-left hover:bg-slate-50 flex items-center justify-between ${
        isSelected ? "bg-slate-100" : ""
      }`}
    >
      <span>{course.name}</span>
      {progress && <ProgressCircle percentage={progress.percentage} />}
    </button>
  );
}

function CourseView({ courseId }: { courseId: Id<"courses"> }) {
  const sections = useQuery(api.sections.getSections, { courseId });

  if (!sections) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>;
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <SectionView key={section._id} section={section} />
      ))}
    </div>
  );
}

function SectionView({ section }: { section: { _id: Id<"sections">; name: string; isCollapsed?: boolean } }) {
  const lessons = useQuery(api.lessons.getLessons, { sectionId: section._id });
  const toggleComplete = useMutation(api.lessons.toggleComplete);
  const toggleCollapsed = useMutation(api.sections.toggleCollapsed);

  if (!lessons) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>;
  }

  const completedLessons = lessons.filter(l => l.completed).length;
  const totalLessons = lessons.length;
  const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">{section.name}</h3>
          <span className="text-sm text-slate-500">
            {completedLessons}/{totalLessons} completed
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ProgressCircle percentage={percentage} />
          <button
            onClick={() => toggleCollapsed({ sectionId: section._id })}
            className="text-slate-500 hover:text-slate-700"
          >
            {section.isCollapsed ? "+" : "-"}
          </button>
        </div>
      </div>
      {!section.isCollapsed && (
        <div className="flex flex-col gap-2">
          {lessons.map((lesson) => (
            <div
              key={lesson._id}
              className="flex items-center gap-2 p-2 rounded hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={lesson.completed}
                onChange={() => toggleComplete({ lessonId: lesson._id })}
                className="h-4 w-4 text-indigo-600 rounded"
              />
              <span className={lesson.completed ? "line-through text-slate-500" : ""}>
                {lesson.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
