"use client";

import { useState } from "react";
import { BTN_PRIMARY } from "@/components/ui/styles";

export default function AddCourseButton() {
  const [open, setOpen] = useState(false);
  const [Modal, setModal] = useState<React.ComponentType<{
    open: boolean;
    onClose: () => void;
  }> | null>(null);

  async function openModal() {
    if (!Modal) {
      const mod = await import("@/components/courses/course-form-modal");
      setModal(() => mod.default);
    }
    setOpen(true);
  }

  return (
    <>
      <button onClick={openModal} className={BTN_PRIMARY}>
        Add course
      </button>
      {Modal && <Modal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
