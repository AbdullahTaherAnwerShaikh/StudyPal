"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/modal";
import {
  createCourse,
  createCourseFromSyllabus,
  updateCourse,
} from "@/lib/actions/courses";
import {
  BTN_PRIMARY,
  BTN_SUBMIT,
  ERROR_BANNER,
  FIELD_ERROR,
  INFO_BANNER,
  INPUT,
  LABEL,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENT_TRACK,
  TEXT_DELETE,
  TEXT_EDIT,
} from "@/components/ui/styles";

const SWATCHES = [
  "#2F5D46",
  "#4A7C59",
  "#3B6E8F",
  "#7C5CB0",
  "#A34A2A",
  "#B08D2E",
  "#8A5A44",
];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOPIC_HOURS = 20;

type FormValues = {
  name: string;
  color: string;
  credits: number;
};

type Mode = "manual" | "import";
type ImportStage = "input" | "preview";

type TopicDraft = { name: string; hours: string };
type ExamDraft = { name: string; date: string };

export default function CourseFormModal({
  open,
  onClose,
  course,
  demo = false,
}: {
  open: boolean;
  onClose: () => void;
  course?: { id: string; name: string; color: string; credits: number | null };
  demo?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const [mode, setMode] = useState<Mode>("manual");
  const [stage, setStage] = useState<ImportStage>("input");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicDraft[]>([]);
  const [exams, setExams] = useState<ExamDraft[]>([]);

  useEffect(() => {
    if (open) {
      reset({
        name: course?.name ?? "",
        color: course?.color ?? "#2F5D46",
        credits: course?.credits ?? 3,
      });
      setError(null);
      setMode("manual");
      setStage("input");
      setImageDataUrl(null);
      setPastedText("");
      setExtracting(false);
      setExtractError(null);
      setTopics([]);
      setExams([]);
    }
  }, [open, course, reset]);

  const selectedColor = watch("color");
  const canImport = !course;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const payload = {
      name: values.name,
      color: values.color,
      credits: Number.isFinite(values.credits) ? values.credits : null,
    };
    const result = course
      ? await updateCourse(course.id, payload)
      : await createCourse(payload);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  });

  const onSubmitImport = handleSubmit(async (values) => {
    setError(null);
    if (!values.name.trim()) {
      setError("Give the course a name.");
      return;
    }
    const missingExamDate = exams.some((exam) => exam.name.trim() && !exam.date);
    if (missingExamDate) {
      setError("Some exams are missing a date — fill them in or remove the rows.");
      return;
    }
    const topicList = topics
      .map((topic) => ({
        name: topic.name.trim(),
        estimated_hours: Math.max(0, Math.round(Number(topic.hours) || 0)),
      }))
      .filter((topic) => topic.name);
    const examList = exams
      .filter((exam) => exam.name.trim() && exam.date)
      .map((exam) => ({ name: exam.name.trim(), date: exam.date }));
    const result = await createCourseFromSyllabus({
      name: values.name,
      color: values.color,
      credits: Number.isFinite(values.credits) ? values.credits : null,
      topics: topicList,
      exams: examList,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setExtractError("Choose an image file (JPEG, PNG, WebP, or GIF).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setExtractError("Image is too large (max 10 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => setExtractError("Couldn't read that image file.");
    reader.readAsDataURL(file);
  }

  async function runExtract() {
    const text = pastedText.trim();
    if (!imageDataUrl && !text) {
      setExtractError("Upload an image or paste some text first.");
      return;
    }
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/syllabus/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUrl ?? undefined,
          text: text || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            courseName?: unknown;
            topics?: unknown[];
            exams?: unknown[];
            error?: unknown;
          }
        | null;
      if (!res.ok) {
        const message = data && "error" in data ? String(data.error) : "";
        setExtractError(
          message || `Request failed (HTTP ${res.status}). Please try again.`
        );
        return;
      }
      if (!data) {
        setExtractError("The server returned an empty response.");
        return;
      }

      const courseName = typeof data.courseName === "string" ? data.courseName : "";
      const topicDrafts: TopicDraft[] = Array.isArray(data.topics)
        ? data.topics.map((item) => {
            const estimated =
              typeof item === "object" && item !== null
                ? Number((item as Record<string, unknown>).estimatedHours)
                : Number.NaN;
            return {
              name: String(
                typeof item === "object" && item !== null
                  ? (item as Record<string, unknown>).name ?? ""
                  : ""
              ),
              hours:
                Number.isFinite(estimated) && estimated > 0
                  ? String(Math.round(estimated))
                  : "",
            };
          })
        : [];
      const examDrafts: ExamDraft[] = Array.isArray(data.exams)
        ? data.exams.map((item) => ({
            name: String(
              typeof item === "object" && item !== null
                ? (item as Record<string, unknown>).name ?? ""
                : ""
            ),
            date: String(
              typeof item === "object" && item !== null
                ? (item as Record<string, unknown>).date ?? ""
                : ""
            ),
          }))
        : [];

      if (!courseName && topicDrafts.length === 0 && examDrafts.length === 0) {
        setExtractError(
          "The AI couldn't read anything from that. Try a clearer image, or paste the text instead."
        );
        return;
      }

      setValue("name", courseName, { shouldValidate: true });
      setTopics(topicDrafts);
      setExams(examDrafts);
      setStage("preview");
    } catch {
      setExtractError("Couldn't reach the server. Is the dev server running?");
    } finally {
      setExtracting(false);
    }
  }

  const segmentClass = (active: boolean) =>
    active ? SEGMENT_ACTIVE : `${SEGMENT_IDLE} min-h-[36px]`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={course ? "Edit course" : "Add course"}
      widthClass={canImport ? "max-w-2xl" : "max-w-md"}
    >
      {demo && (
        <div className={`${INFO_BANNER} mb-6`}>
          Demo mode has restricted functionality — adding a course is disabled.
          Sign in to create a real course.
        </div>
      )}

      {canImport && (
        <div className={`${SEGMENT_TRACK} mb-6`}>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={segmentClass(mode === "manual")}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={segmentClass(mode === "import")}
          >
            Import from syllabus
          </button>
        </div>
      )}

      {mode === "manual" && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={LABEL}>Name</label>
            <input
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Calculus II"
              className={INPUT}
            />
            {errors.name && <p className={FIELD_ERROR}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={LABEL}>Color</label>
            <div className="flex items-center gap-2">
              {SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setValue("color", hex)}
                  aria-label={`Use color ${hex}`}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    selectedColor === hex
                      ? "ring-2 ring-ink/70 ring-offset-2 ring-offset-card"
                      : ""
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <input
                {...register("color")}
                type="color"
                aria-label="Custom color"
                className="ml-auto h-8 w-10 cursor-pointer rounded border border-ink/20 bg-white"
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Credits</label>
            <input
              {...register("credits", { valueAsNumber: true })}
              type="number"
              min={0}
              max={99}
              step={1}
              className={INPUT}
            />
          </div>

          {error && <p className={ERROR_BANNER}>{error}</p>}

          <button type="submit" disabled={isSubmitting || demo} className={BTN_SUBMIT}>
            {isSubmitting ? "Saving..." : course ? "Save changes" : "Create course"}
          </button>
        </form>
      )}

      {mode === "import" && stage === "input" && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted">
            Upload a photo of your syllabus or paste the course outline from an
            online page. Gemini extracts the course name, topics, and exam dates
            for you to review before saving.
          </p>

          <div>
            <span className={LABEL}>Syllabus image</span>
            <label className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-btn bg-surface px-4 text-sm font-bold text-accent shadow-inset outline-none transition-shadow duration-300 hover:shadow-inset-deep">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Choose image…
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {imageDataUrl && (
              <div className="mt-2 flex items-center gap-3 rounded-btn bg-surface p-2 shadow-inset-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDataUrl}
                  alt="Syllabus preview"
                  className="h-16 w-16 rounded-inner object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted">
                  Syllabus image
                </span>
                <button
                  type="button"
                  onClick={() => setImageDataUrl(null)}
                  className={TEXT_DELETE}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={LABEL}>Or paste the syllabus text</label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. Copy-paste from your course's outline page…"
              className="w-full min-h-[96px] resize-y rounded-btn bg-surface px-4 py-3 text-sm text-ink shadow-inset outline-none placeholder:text-muted/60 transition-shadow duration-300 focus:shadow-inset-deep"
            />
          </div>

          {extractError && <p className={ERROR_BANNER}>{extractError}</p>}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={TEXT_EDIT}
            >
              Enter manually instead
            </button>
            <button
              type="button"
              onClick={runExtract}
              disabled={demo || extracting || (!imageDataUrl && !pastedText.trim())}
              className={BTN_PRIMARY}
            >
              {extracting ? "Extracting…" : "Extract with AI"}
            </button>
          </div>
        </div>
      )}

      {mode === "import" && stage === "preview" && (
        <form onSubmit={onSubmitImport} className="space-y-4">
          <div className="rounded-btn bg-surface p-3 text-xs font-medium text-muted shadow-inset">
            Review what the AI found. You can edit anything before saving.
          </div>

          <div>
            <label className={LABEL}>Name</label>
            <input
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Calculus II"
              className={INPUT}
            />
            {errors.name && <p className={FIELD_ERROR}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={LABEL}>Color</label>
            <div className="flex items-center gap-2">
              {SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setValue("color", hex)}
                  aria-label={`Use color ${hex}`}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    selectedColor === hex
                      ? "ring-2 ring-ink/70 ring-offset-2 ring-offset-card"
                      : ""
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <input
                {...register("color")}
                type="color"
                aria-label="Custom color"
                className="ml-auto h-8 w-10 cursor-pointer rounded border border-ink/20 bg-white"
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Credits</label>
            <input
              {...register("credits", { valueAsNumber: true })}
              type="number"
              min={0}
              max={99}
              step={1}
              className={INPUT}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className={LABEL}>Topics</span>
              <button
                type="button"
                onClick={() => setTopics((list) => [...list, { name: "", hours: "" }])}
                className={TEXT_EDIT}
              >
                + Add topic
              </button>
            </div>
            {topics.length === 0 ? (
              <p className="text-xs font-medium text-muted">No topics extracted.</p>
            ) : (
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-btn bg-surface p-2 shadow-inset">
                {topics.map((topic, index) => {
                  const hoursValue = Number(topic.hours);
                  const highEstimate =
                    Number.isFinite(hoursValue) &&
                    hoursValue > MAX_TOPIC_HOURS;
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Topic name"
                            value={topic.name}
                            onChange={(e) =>
                              setTopics((list) =>
                                list.map((item, i) =>
                                  i === index ? { ...item, name: e.target.value } : item
                                )
                              )
                            }
                            className={INPUT}
                            aria-label="Topic name"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            placeholder="Hours"
                            value={topic.hours}
                            onChange={(e) =>
                              setTopics((list) =>
                                list.map((item, i) =>
                                  i === index ? { ...item, hours: e.target.value } : item
                                )
                              )
                            }
                            className={`${INPUT} ${
                              highEstimate ? "shadow-inset-deep" : ""
                            }`}
                            aria-label="Estimated hours"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setTopics((list) => list.filter((_, i) => i !== index))
                          }
                          className={`${TEXT_DELETE} mt-1 shrink-0`}
                          aria-label="Remove topic"
                        >
                          Remove
                        </button>
                      </div>
                      {highEstimate && (
                        <p className="text-[11px] font-semibold text-warn">
                          This estimate seems high ({hoursValue} hrs) — please
                          review.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className={LABEL}>Exams</span>
              <button
                type="button"
                onClick={() => setExams((list) => [...list, { name: "", date: "" }])}
                className={TEXT_EDIT}
              >
                + Add exam
              </button>
            </div>
            {exams.length === 0 ? (
              <p className="text-xs font-medium text-muted">No exams extracted.</p>
            ) : (
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-btn bg-surface p-2 shadow-inset">
                {exams.map((exam, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Exam name"
                        value={exam.name}
                        onChange={(e) =>
                          setExams((list) =>
                            list.map((item, i) =>
                              i === index ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                        className={INPUT}
                        aria-label="Exam name"
                      />
                    </div>
                    <div className="w-44">
                      <input
                        type="date"
                        value={exam.date}
                        onChange={(e) =>
                          setExams((list) =>
                            list.map((item, i) =>
                              i === index ? { ...item, date: e.target.value } : item
                            )
                          )
                        }
                        className={INPUT}
                        aria-label="Exam date"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExams((list) => list.filter((_, i) => i !== index))
                      }
                      className={`${TEXT_DELETE} mt-1 shrink-0`}
                      aria-label="Remove exam"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className={ERROR_BANNER}>{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStage("input")}
              className={TEXT_EDIT}
            >
              Try a different image / text
            </button>
<button type="submit" disabled={isSubmitting || demo} className={`${BTN_PRIMARY} px-6`}>
                {isSubmitting ? "Saving…" : "Create course"}
              </button>
          </div>
        </form>
      )}
    </Modal>
  );
}