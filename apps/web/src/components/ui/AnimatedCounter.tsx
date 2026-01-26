'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
    end: number
    duration?: number
    suffix?: string
    prefix?: string
    className?: string
    decimals?: number
}

export default function AnimatedCounter({
    end,
    duration = 2000,
    suffix = '',
    prefix = '',
    className = '',
    decimals = 0,
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true)
                        animateValue(0, end, duration)
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [end, duration, hasAnimated])

    const animateValue = (start: number, end: number, duration: number) => {
        const startTimestamp = performance.now()

        const step = (timestamp: number) => {
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            // Easing function for smooth animation (ease-out-expo)
            const easeProgress = 1 - Math.pow(1 - progress, 4)
            const currentValue = start + (end - start) * easeProgress

            setCount(currentValue)

            if (progress < 1) {
                requestAnimationFrame(step)
            } else {
                setCount(end)
            }
        }

        requestAnimationFrame(step)
    }

    const displayValue = decimals > 0
        ? count.toFixed(decimals)
        : Math.floor(count).toLocaleString()

    return (
        <span ref={ref} className={className}>
            {prefix}{displayValue}{suffix}
        </span>
    )
}
