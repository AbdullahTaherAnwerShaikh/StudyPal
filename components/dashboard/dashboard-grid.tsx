"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { layoutsAreEqual } from "@/lib/dashboard-layout";
import type {
  DashboardLayoutEntry,
  DashboardWidgetKey,
  DashboardWidgetSpan,
} from "@/lib/dashboard-layout";
import { BTN_SMALL_GHOST, BTN_SMALL_PRIMARY } from "@/components/ui/styles";

type GridWidget = {
  key: DashboardWidgetKey;
  label: string;
  element: ReactNode;
};

function SortableItem({
  id,
  span,
  label,
  enabled,
  toggleWide,
  children,
}: {
  id: string;
  span: DashboardWidgetSpan;
  label: string;
  enabled: boolean;
  toggleWide: () => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !enabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(enabled ? attributes : {})}
      {...(enabled ? listeners : {})}
      aria-label={enabled ? `Widget: ${label}. Drag to rearrange.` : undefined}
      className={`relative ${span} ${isDragging ? "z-10" : ""}`}
    >
      {enabled && (
        <div
          className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-surface p-1 text-[11px] font-bold shadow-extruded"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleWide();
            }}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              span === "" ? "text-accent shadow-inset-sm" : "text-muted"
            }`}
          >
            Half
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleWide();
            }}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              span === "md:col-span-2" ? "text-accent shadow-inset-sm" : "text-muted"
            }`}
          >
            Wide
          </button>
        </div>
      )}
      <div
        className={`transition-opacity duration-200 ${
          enabled && (isDragging ? "opacity-40" : "cursor-grab")
        } active:cursor-grabbing`}
      >
        {children}
      </div>
    </div>
  );
}

export default function DashboardGrid({
  initialLayout,
  widgets,
}: {
  initialLayout: DashboardLayoutEntry[];
  widgets: GridWidget[];
}) {
  const [savedLayout, setSavedLayout] =
    useState<DashboardLayoutEntry[]>(initialLayout);
  const [layout, setLayout] = useState<DashboardLayoutEntry[]>(initialLayout);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing && layoutsAreEqual(layout, savedLayout)) {
      setLayout(initialLayout);
      setSavedLayout(initialLayout);
    }
  }, [initialLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const widgetMeta = new Map(widgets.map((widget) => [widget.key, widget]));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layout.findIndex((entry) => entry.key === active.id);
    const newIndex = layout.findIndex((entry) => entry.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(layout, oldIndex, newIndex);
    setLayout(next);
  }

  function toggleWide(key: DashboardWidgetKey) {
    setLayout(
      layout.map((entry) =>
        entry.key === key
          ? {
              ...entry,
              span: entry.span === "md:col-span-2" ? "" : "md:col-span-2",
            }
          : entry
      )
    );
  }

  async function saveChanges() {
    try {
      const res = await fetch("/api/dashboard/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
      });
      if (!res.ok) {
        throw new Error(`Save failed with status ${res.status}`);
      }
      setSavedLayout(layout);
      setEditing(false);
    } catch {
      setLayout(savedLayout);
      setEditing(false);
    }
  }

  function resetChanges() {
    setLayout(savedLayout);
  }

  const dirty = !layoutsAreEqual(layout, savedLayout);

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-2 sm:justify-between">
        {editing ? (
          <p className="hidden text-xs font-medium text-muted sm:block">
            Editing layout — drag cards to rearrange, use Half/Wide to resize.
          </p>
        ) : (
          <p className="hidden text-xs font-medium text-muted sm:block">
            Layout is locked.
          </p>
        )}
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={resetChanges}
                disabled={!dirty}
                className={BTN_SMALL_GHOST}
              >
                Reset changes
              </button>
              <button
                type="button"
                onClick={saveChanges}
                className={BTN_SMALL_PRIMARY}
              >
                Save changes
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={BTN_SMALL_GHOST}
            >
              Edit layout
            </button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
        items={layout.map((entry) => entry.key)}
        strategy={rectSortingStrategy}
      >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {layout.map((entry) => {
              const meta = widgetMeta.get(entry.key);
              if (!meta) return null;
              return (
                <SortableItem
                  key={entry.key}
                  id={entry.key}
                  span={entry.span}
                  label={meta.label}
                  enabled={editing}
                  toggleWide={() => toggleWide(entry.key)}
                >
                  {meta.element}
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}