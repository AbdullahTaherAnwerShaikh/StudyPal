"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/modal";
import { BTN_PRIMARY } from "@/components/ui/styles";

export default function AddCourseButton({ demo = false }: { demo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  const [CourseModal, setCourseModal] = useState<React.ComponentType<{
    open: boolean;
    onClose: () => void;
  }> | null>(null);

  function handleClick() {
    if (demo) {
      setShowDemoNotice(true);
      return;
    }
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
      {CourseModal && !demo && (
        <CourseModal open={open} onClose={() => setOpen(false)} />
      )}
      {demo && (
        <Modal
          open={showDemoNotice}
          onClose={() => setShowDemoNotice(false)}
          title="Demo mode"
        >
          <p className="text-sm font-medium text-ink">
            Demo mode has restricted functionality — you can browse the sample
            data, but changes like adding a course are only available after you
            sign in.
          </p>
          <div className="mt-6 flex justify-end">
            <Link
              href="/login"
              onClick={() => setShowDemoNotice(false)}
              className={BTN_PRIMARY}
            >
              Go to sign in
            </Link>
          </div>
        </Modal>
      )}
    </>
  );
}