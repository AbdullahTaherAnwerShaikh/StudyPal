"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { INPUT, LABEL } from "@/components/ui/styles";
import type { CourseOption } from "@/lib/types";

export default function NoteMetaFields({
  courses,
  courseId,
  topicId,
  tagsText,
  onCourseChange,
  onTopicChange,
  onTagsChange,
  onTopicsLoaded,
}: {
  courses: CourseOption[];
  courseId: string;
  topicId: string;
  tagsText: string;
  onCourseChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onTopicsLoaded?: (topics: { id: string; name: string }[]) => void;
}) {
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const lastCourseRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastCourseRef.current !== null && lastCourseRef.current !== courseId) {
      onTopicChange("");
    }
    lastCourseRef.current = courseId;
  }, [courseId, onTopicChange]);

  useEffect(() => {
    if (!courseId) {
      setTopics([]);
      setLoadingTopics(false);
      if (onTopicsLoaded) onTopicsLoaded([]);
      return;
    }
    let cancelled = false;
    setLoadingTopics(true);
    createClient()
      .from("topics")
      .select("id, name")
      .eq("course_id", courseId)
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setTopics(data ?? []);
          setLoadingTopics(false);
          if (onTopicsLoaded) onTopicsLoaded(data ?? []);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, onTopicsLoaded]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL}>Course (optional)</label>
          <select
            value={courseId}
            onChange={(event) => onCourseChange(event.target.value)}
            className={INPUT}
          >
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Topic (optional)</label>
          <select
            value={topicId}
            onChange={(event) => onTopicChange(event.target.value)}
            disabled={!courseId}
            className={`${INPUT} disabled:opacity-40`}
          >
            {!courseId ? (
              <option value="">Select a course first</option>
            ) : (
              <>
                <option value="">Whole course</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </>
            )}
          </select>
          {loadingTopics && (
            <p className="mt-1 text-[11px] text-ink/45">Loading topics...</p>
          )}
        </div>
      </div>

      <div>
        <label className={LABEL}>Tags (comma separated)</label>
        <input
          value={tagsText}
          onChange={(event) => onTagsChange(event.target.value)}
          placeholder="math, exam-prep"
          className={INPUT}
        />
      </div>
    </div>
  );
}