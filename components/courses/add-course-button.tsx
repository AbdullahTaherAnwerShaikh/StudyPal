"use client";

import { useState } from "react";
import { BTN_PRIMARY } from "@/components/ui/styles";

export default function AddCourseButton({ demo = false }: { demo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [CourseModal, setCourseModal] = useState<React.ComponentType<{
    open: boolean;
    onClose: () => void;
    demo?: boolean;
  }> | null>(null);

  function handleClick() {
    void openModal();
  }

  async function openModal() {
    if (!CourseModal) {
      const mod = await import("@/components/courses/course-form-modal");
      setCourseModal(() => mod.default);
    }
    setOpen(true);
  }

  return (
    <>
      <button onClick={handleClick} className={BTN_PRIMARY}>
        Add course
      </button>
      {CourseModal && (
        <CourseModal open={open} onClose={() => setOpen(false)} demo={demo} />
      )}
    </>
  );
}