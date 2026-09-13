import React, { useEffect, useRef } from "react";
import katex from "katex";

interface KatexRendererProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const KatexRenderer: React.FC<KatexRendererProps> = ({ math, block = false, className = "" }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
        });
      } catch (err) {
        containerRef.current.innerText = math;
      }
    }
  }, [math, block]);

  return <span ref={containerRef} className={className} />;
};
