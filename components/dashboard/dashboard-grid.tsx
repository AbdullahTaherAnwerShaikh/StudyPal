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
import type { DashboardWidgetKey } from "@/lib/dashboard-layout";
import { BTN_SMALL_GHOST, BTN_SMALL_PRIMARY } from "@/components/ui/styles";

type GridWidget = {
  key: DashboardWidgetKey;
  label: string;
  span: string;
  element: ReactNode;
};

function SortableItem({
  id,
  span,
  label,
  enabled,
  children,
}: {
  id: string;
  span: string;
  label: string;
  enabled: boolean;
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
  initialLayout: DashboardWidgetKey[];
  widgets: GridWidget[];
}) {
  const [savedLayout, setSavedLayout] =
    useState<DashboardWidgetKey[]>(initialLayout);
  const [layout, setLayout] = useState<DashboardWidgetKey[]>(initialLayout);
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
    const oldIndex = layout.indexOf(active.id as DashboardWidgetKey);
    const newIndex = layout.indexOf(over.id as DashboardWidgetKey);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(layout, oldIndex, newIndex);
    setLayout(next);
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
            Editing layout — drag cards to rearrange.
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
                disabled={!dirty}
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
        <SortableContext items={[...layout]} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {layout.map((key) => {
              const meta = widgetMeta.get(key);
              if (!meta) return null;
              return (
                <SortableItem
                  key={key}
                  id={key}
                  span={meta.span}
                  label={meta.label}
                  enabled={editing}
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