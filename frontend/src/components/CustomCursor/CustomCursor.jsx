import React, { useEffect, useState, useRef } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: -100, y: -100 });
    const trailingPosition = useRef({ x: -100, y: -100 });
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const cursorRingRef = useRef(null);
    const requestRef = useRef(null);

    useEffect(() => {
        // Only show custom cursor on desktop devices where fine pointer is available
        const isDesktop = window.matchMedia("(pointer: fine)").matches;
        if (!isDesktop) return;

        const updatePosition = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
            if (!isVisible) setIsVisible(true);
        };

        const updateHoverState = (e) => {
            // Check if hovering over clickable elements
            const target = e.target;
            const isClickable =
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('a') !== null ||
                target.closest('button') !== null ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(isClickable);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        document.addEventListener('mousemove', updatePosition);
        document.addEventListener('mouseover', updateHoverState);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        // Smooth trailing animation loop
        const animate = () => {
            // Lerp (Linear Interpolation) for buttery smooth delay
            trailingPosition.current.x += (position.x - trailingPosition.current.x) * 0.15;
            trailingPosition.current.y += (position.y - trailingPosition.current.y) * 0.15;

            if (cursorRingRef.current) {
                cursorRingRef.current.style.transform = `translate3d(${trailingPosition.current.x}px, ${trailingPosition.current.y}px, 0)`;
            }
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener('mousemove', updatePosition);
            document.removeEventListener('mouseover', updateHoverState);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
            cancelAnimationFrame(requestRef.current);
        };
    }, [isVisible, position]);

    if (!isVisible) return null;

    return (
        <>
            <div
                className={`custom-cursor-dot ${isHovering ? 'hover' : ''} ${isClicking ? 'clicking' : ''}`}
                style={{
                    transform: `translate3d(${position.x}px, ${position.y}px, 0)`
                }}
            />
            <div
                ref={cursorRingRef}
                className={`custom-cursor-glow ${isHovering ? 'hover' : ''} ${isClicking ? 'clicking' : ''}`}
            />
        </>
    );
};

export default CustomCursor;
