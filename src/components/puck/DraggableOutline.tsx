"use client";

import React, { useState, useCallback, useMemo } from "react";
import { createUsePuck } from "@puckeditor/core";
import type { Config, ComponentData, Data } from "@puckeditor/core";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Inline SVG icons (no lucide-react dependency)
const IconGrip = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/>
    <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
    <circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
    <rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>
  </svg>
);
const IconType = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>
  </svg>
);

const usePuck = createUsePuck();

// ── Types ──────────────────────────────────────────────────────────
type ZoneContent = ComponentData[];

interface TreeItem {
  id: string;
  type: string;
  label: string;
  zone: string; // zone compound this item belongs to
  index: number; // index within its zone
  childZones: string[]; // zone compounds of children
}

// ── Helpers ────────────────────────────────────────────────────────

/** Get the display label for a component type */
function getComponentLabel(type: string, config: Config): string {
  return (config.components[type] as { label?: string } | undefined)?.label ?? type;
}

/** Zones each container-type component provides, even before anything is dropped in
    (data.zones only gains a key once a zone has content) */
const COMPONENT_ZONES: Record<string, (props: Record<string, unknown>) => string[]> = {
  Container: () => ["container-content"],
  FloatBox: () => ["float-content"],
  Columns: (props) =>
    Array.from({ length: props.columns === "3" ? 3 : 2 }, (_, i) => `column-${i}`),
};

/** Extract all zone compounds that belong to a given component */
function getChildZones(comp: ComponentData, zones: Record<string, ZoneContent>): string[] {
  const id = comp.props.id;
  const fromData = Object.keys(zones).filter((z) => z.startsWith(`${id}:`));
  const expected = (COMPONENT_ZONES[comp.type]?.(comp.props) ?? []).map((z) => `${id}:${z}`);
  return [...new Set([...expected, ...fromData])];
}

/** True if destZone is owned by draggedId or any of its descendants (would nest a
    component inside itself) */
function isOwnDescendantZone(destZone: string, draggedId: string, data: Data): boolean {
  let owner = destZone.split(":")[0];
  const seen = new Set<string>();
  while (owner && owner !== "root" && !seen.has(owner)) {
    if (owner === draggedId) return true;
    seen.add(owner);
    let parentZone: string | undefined;
    for (const [zc, content] of Object.entries(data.zones ?? {})) {
      if (content.some((c) => c.props.id === owner)) {
        parentZone = zc;
        break;
      }
    }
    if (!parentZone) break;
    owner = parentZone.split(":")[0];
  }
  return false;
}

/** Get content for a zone compound from data */
function getZoneContent(zoneCompound: string, data: Data): ZoneContent {
  if (zoneCompound === "root:default-zone") {
    return data.content ?? [];
  }
  return data.zones?.[zoneCompound] ?? [];
}

/** Get the zone label (the part after the colon) */
function getZoneLabel(zoneCompound: string): string {
  const parts = zoneCompound.split(":");
  return parts[1] ?? zoneCompound;
}

// ── Sortable Layer Item ────────────────────────────────────────────

function SortableLayer({
  item,
  config,
  data,
  selectedId,
  onSelect,
  expandedItems,
  onToggleExpand,
  depth = 0,
}: {
  item: TreeItem;
  config: Config;
  data: Data;
  selectedId: string | null;
  onSelect: (id: string, index: number, zone: string) => void;
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  depth?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { zone: item.zone, index: item.index } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isSelected = selectedId === item.id;
  const isExpanded = expandedItems.has(item.id);
  const hasChildren = item.childZones.length > 0;
  const isTextLike = item.type === "Text" || item.type === "Heading" || item.type === "RichText";

  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <div
        className={`flex items-center rounded px-2 py-1.5 text-sm transition-colors ${
          isSelected
            ? "bg-blue-100 border border-blue-300"
            : "border border-transparent hover:bg-neutral-100"
        }`}
        style={{ paddingLeft: 8 + depth * 20 }}
      >
        {/* Drag handle */}
        <button
          className="mr-2 cursor-grab touch-none rounded p-1 text-neutral-400 hover:text-neutral-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <IconGrip />
        </button>

        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <button
            className="mr-1.5 p-1 text-neutral-400 hover:text-neutral-600"
            onClick={() => onToggleExpand(item.id)}
          >
            {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
          </button>
        ) : (
          <span className="mr-1.5 inline-block w-[24px]" />
        )}

        {/* Icon */}
        <span className="mr-2 text-rose-400">
          {isTextLike ? <IconType /> : <IconGrid />}
        </span>

        {/* Label — click to select */}
        <button
          className="flex-1 truncate text-left text-neutral-700 hover:text-neutral-900"
          onClick={() => onSelect(item.id, item.index, item.zone)}
        >
          {item.label}
        </button>
      </div>

      {/* Child zones */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {item.childZones.map((childZone) => (
            <SortableZone
              key={childZone}
              zoneCompound={childZone}
              config={config}
              data={data}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
              showLabel={item.childZones.length > 1}
            />
          ))}
        </div>
      )}
    </li>
  );
}

// ── Sortable Zone ──────────────────────────────────────────────────

function SortableZone({
  zoneCompound,
  config,
  data,
  selectedId,
  onSelect,
  expandedItems,
  onToggleExpand,
  depth = 0,
  showLabel = false,
}: {
  zoneCompound: string;
  config: Config;
  data: Data;
  selectedId: string | null;
  onSelect: (id: string, index: number, zone: string) => void;
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  depth?: number;
  showLabel?: boolean;
}) {
  const content = getZoneContent(zoneCompound, data);
  const items: TreeItem[] = content.map((comp, i) => ({
    id: comp.props.id,
    type: comp.type,
    label: getComponentLabel(comp.type, config),
    zone: zoneCompound,
    index: i,
    childZones: getChildZones(comp, data.zones ?? {}),
  }));

  const itemIds = items.map((it) => it.id);

  return (
    <div style={{ paddingLeft: showLabel ? depth * 8 : 0 }}>
      {showLabel && (
        <div className="mb-1 ml-2 mt-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
          {getZoneLabel(zoneCompound)}
        </div>
      )}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ul className="m-0 list-none p-0">
          {items.length === 0 && (
            <EmptyZoneDropTarget zoneCompound={zoneCompound} />
          )}
          {items.map((item) => (
            <SortableLayer
              key={item.id}
              item={item}
              config={config}
              data={data}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
              depth={depth}
            />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
}

// ── Empty zone drop target ─────────────────────────────────────────

function EmptyZoneDropTarget({ zoneCompound }: { zoneCompound: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `empty:${zoneCompound}`,
    data: { zone: zoneCompound, index: 0 },
  });
  return (
    <li
      ref={setNodeRef}
      className={`list-none rounded border border-dashed px-2 py-2 text-center text-xs transition-colors ${
        isOver
          ? "border-blue-400 bg-blue-50 text-blue-600"
          : "border-neutral-200 text-neutral-400"
      }`}
    >
      Drop here
    </li>
  );
}

// ── Main Outline Component ─────────────────────────────────────────

export default function DraggableOutline() {
  const dispatch = usePuck((s) => s.dispatch);
  const data = usePuck((s) => s.appState.data);
  const config = usePuck((s) => s.config);
  const selectedItem = usePuck((s) => s.selectedItem);

  const selectedId = selectedItem?.props?.id ?? null;

  // Track which items are expanded (show child zones)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  // Every component that has child zones — expanded during a drag so all
  // zones are visible drop targets
  const allContainerIds = useMemo(() => {
    const set = new Set<string>();
    const collect = (content: ZoneContent) =>
      content.forEach((c) => {
        if (getChildZones(c, data.zones ?? {}).length > 0) set.add(c.props.id);
      });
    collect(data.content ?? []);
    Object.values(data.zones ?? {}).forEach(collect);
    return set;
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string, index: number, zone: string) => {
      if (selectedId === id) {
        dispatch({ type: "setUi", ui: { itemSelector: null } });
      } else {
        dispatch({
          type: "setUi",
          ui: { itemSelector: { index, zone } },
        });
      }
    },
    [dispatch, selectedId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const activeData = active.data.current as { zone: string; index: number };
      const overData = over.data.current as { zone: string; index: number };

      if (!activeData || !overData) return;

      const sourceZone = activeData.zone;
      const destZone = overData.zone;
      const sourceIndex = activeData.index;
      const destIndex = overData.index;

      // Never move a container into itself or one of its descendants
      if (isOwnDescendantZone(destZone, String(active.id), data)) return;

      // If same zone, use reorder
      if (sourceZone === destZone) {
        if (sourceIndex === destIndex) return;
        dispatch({
          type: "reorder",
          sourceIndex,
          destinationIndex: destIndex,
          destinationZone: destZone,
        });
      } else {
        // Cross-zone move
        dispatch({
          type: "move",
          sourceIndex,
          sourceZone,
          destinationIndex: destIndex,
          destinationZone: destZone,
        });
      }
    },
    [dispatch, data]
  );

  // Auto-expand parent of selected item; expand everything while dragging so
  // any container zone can receive the drop
  const expandedWithSelected = useMemo(() => {
    const set = new Set(expandedItems);
    if (isDragging) {
      allContainerIds.forEach((id) => set.add(id));
      return set;
    }
    if (selectedId && data.zones) {
      // Check if selected item is inside a zone — expand its parent
      for (const [zoneCompound, content] of Object.entries(data.zones)) {
        if (content.some((c: ComponentData) => c.props.id === selectedId)) {
          const parentId = zoneCompound.split(":")[0];
          set.add(parentId);
        }
      }
    }
    return set;
  }, [expandedItems, selectedId, data.zones, isDragging, allContainerIds]);

  return (
    <div className="puck-draggable-outline font-sans text-sm">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragging(true)}
        onDragCancel={() => setIsDragging(false)}
        onDragEnd={handleDragEnd}
      >
        <SortableZone
          zoneCompound="root:default-zone"
          config={config}
          data={data}
          selectedId={selectedId}
          onSelect={handleSelect}
          expandedItems={expandedWithSelected}
          onToggleExpand={handleToggleExpand}
        />
      </DndContext>
    </div>
  );
}

// ── Plugin factory ─────────────────────────────────────────────────

export function draggableOutlinePlugin() {
  return {
    overrides: {
      outline: () => <DraggableOutline />,
    },
  };
}
