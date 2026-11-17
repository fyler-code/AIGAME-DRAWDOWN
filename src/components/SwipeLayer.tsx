import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { Choice } from '@/types'

interface SwipeLayerProps {
  disabled: boolean
  onSwipeStart: () => void
  onSwipeCancel: () => void
  onCommit: (choice: Choice) => void
  children: ReactNode
}

/** 判定阈值（与原设计一致，不许改） */
const THRESHOLD_RATIO = 0.18
const THRESHOLD_VELOCITY = 0.5
const SPRING_MS = 220

interface GestureState {
  active: boolean
  pointerId: number
  startY: number
  startTime: number
  dy: number
}

/**
 * 手势层：位移、速度全部在 ref 里，每帧只写 style.transform。
 * pointermove 里一次 setState 都没有 —— 这是不掉帧的前提。
 */
export function SwipeLayer({
  disabled,
  onSwipeStart,
  onSwipeCancel,
  onCommit,
  children,
}: SwipeLayerProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<GestureState>({
    active: false,
    pointerId: -1,
    startY: 0,
    startTime: 0,
    dy: 0,
  })
  const frameRef = useRef(0)
  const springRef = useRef(0)

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current)
      cancelAnimationFrame(springRef.current)
    }
  }, [])

  const paint = (dy: number) => {
    const el = cardRef.current
    if (el) el.style.transform = `translate3d(0, ${dy}px, 0)`
  }

  const normalize = () => {
    const el = cardRef.current
    if (el) el.style.transform = ''
  }

  const springBack = () => {
    cancelAnimationFrame(frameRef.current)
    const started = performance.now()
    const from = gesture.current.dy

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / SPRING_MS)
      paint(from * (1 - t))
      if (t < 1) {
        springRef.current = requestAnimationFrame(tick)
      } else {
        normalize()
        onSwipeCancel()
      }
    }
    springRef.current = requestAnimationFrame(tick)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return

    e.currentTarget.setPointerCapture(e.pointerId)
    cancelAnimationFrame(springRef.current)
    gesture.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startTime: performance.now(),
      dy: 0,
    }
    onSwipeStart()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g.active) return

    g.dy = e.clientY - g.startY
    if (frameRef.current !== 0) return

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0
      paint(gesture.current.dy)
    })
  }

  const endGesture = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g.active) return
    g.active = false

    if (e.currentTarget.hasPointerCapture(g.pointerId)) {
      e.currentTarget.releasePointerCapture(g.pointerId)
    }
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0

    const elapsed = Math.max(1, performance.now() - g.startTime)
    const velocity = g.dy / elapsed
    const height = wrapRef.current?.clientHeight ?? 0
    const passed =
      Math.abs(g.dy) >= height * THRESHOLD_RATIO || Math.abs(velocity) >= THRESHOLD_VELOCITY

    if (passed) {
      normalize()
      // 屏幕坐标 y 向下为正：上滑 dy < 0 → up
      onCommit(g.dy < 0 ? 'up' : 'down')
      return
    }

    springBack()
  }

  const onPointerCancel = () => {
    if (!gesture.current.active) return
    gesture.current.active = false
    springBack()
  }

  return (
    <div
      ref={wrapRef}
      className="g-swipe"
      data-testid="swipe-layer"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={onPointerCancel}
    >
      <div ref={cardRef} className="g-swipe-card">
        {children}
      </div>
    </div>
  )
}
