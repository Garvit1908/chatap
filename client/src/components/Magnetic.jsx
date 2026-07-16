import { useRef, useState } from "react";

export default function Magnetic({ children }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;
    
    // 0.35 controls the intensity of the magnetic pull
    setPosition({ x: x * 0.35, y: y * 0.35 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`, 
        transition: x === 0 && y === 0 ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
        willChange: "transform"
      }}
      className="inline-block w-full sm:w-auto"
    >
      {children}
    </div>
  );
}
