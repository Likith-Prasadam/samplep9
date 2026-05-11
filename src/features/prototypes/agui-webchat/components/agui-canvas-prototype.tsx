import React, { useRef, useState } from 'react';

export type AguiNodeId =
  | 'camera'
  | 'process'
  | 'model'
  | 'prompts'
  | 'duration';

export type AguiNodeStatus = 'missing' | 'ready';

export interface AguiNode {
  id: AguiNodeId;
  title: string;
  subtitle?: string;
  x: number;
  y: number;
  status: AguiNodeStatus;
}

interface AguiCanvasPrototypeProps {
  nodes: AguiNode[];
  selectedNodeId: AguiNodeId | null;
  onSelectNode: (id: AguiNodeId) => void;
  onChangeNodePosition: (id: AguiNodeId, x: number, y: number) => void;
}

export function AguiCanvasPrototype({
  nodes,
  selectedNodeId,
  onSelectNode,
  onChangeNodePosition,
}: AguiCanvasPrototypeProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<{
    id: AguiNodeId;
    pointerOffsetX: number;
    pointerOffsetY: number;
    pointerId: number;
  } | null>(null);

  const getPointerInCanvas = (e: React.PointerEvent) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + el.scrollLeft,
      y: e.clientY - rect.top + el.scrollTop,
    };
  };

  return (
    <div
      ref={canvasRef}
      className="relative overflow-auto rounded-lg border border-border/60 bg-muted/20"
      style={{ minHeight: 520 }}
    >
      <div className="relative min-h-[520px] w-full">
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          return (
            <div
              key={node.id}
              role="button"
              tabIndex={0}
              className={[
                'absolute rounded-lg border p-3 cursor-grab select-none',
                node.status === 'ready'
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-border/80 bg-background/60',
                isSelected ? 'ring-2 ring-ring/40' : 'ring-0',
              ].join(' ')}
              style={{ left: node.x, top: node.y, width: 200 }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                const { x, y } = getPointerInCanvas(e);
                onSelectNode(node.id);
                setDragging({
                  id: node.id,
                  pointerOffsetX: x - node.x,
                  pointerOffsetY: y - node.y,
                  pointerId: e.pointerId,
                });
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!dragging || dragging.id !== node.id) return;
                const { x, y } = getPointerInCanvas(e);
                const nextX = x - dragging.pointerOffsetX;
                const nextY = y - dragging.pointerOffsetY;
                onChangeNodePosition(node.id, nextX, nextY);
              }}
              onPointerUp={(e) => {
                if (!dragging || dragging.id !== node.id) return;
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                  // ignore
                }
                setDragging(null);
              }}
              onPointerCancel={() => setDragging(null)}
              onDoubleClick={() => onSelectNode(node.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{node.title}</div>
                  {node.subtitle && (
                    <div className="text-xs text-muted-foreground mt-1 break-all">
                      {node.subtitle}
                    </div>
                  )}
                </div>
                <div
                  className={[
                    'mt-1 shrink-0 w-2.5 h-2.5 rounded-full',
                    node.status === 'ready'
                      ? 'bg-green-500'
                      : 'bg-muted-foreground/40',
                  ].join(' ')}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional: placeholder background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          color: 'rgb(100 116 139)', // slate-ish for subtle grid
        }}
      />
    </div>
  );
}
