import React, { useRef, useState, useEffect } from "react";

export const defaultEasing = [0.22, 1, 0.36, 1];

export const Reveal = ({ children, width, delay = 0, staggerChildren = 0, className = "" }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const renderContent = () => {
    // If staggerChildren is requested and the child is a container with multiple children (e.g. grid of cards)
    if (staggerChildren > 0 && React.isValidElement(children)) {
      const innerChildren = children.props?.children;
      if (Array.isArray(innerChildren) && innerChildren.length > 0) {
        const staggered = innerChildren.map((child, idx) => {
          if (!React.isValidElement(child)) return child;
          return (
            <div
              key={child.key || idx}
              className={`h-full ${isVisible ? "reveal-visible" : "reveal-init"}`}
              style={{ animationDelay: `${(delay || 0) + idx * staggerChildren}s` }}
            >
              {child}
            </div>
          );
        });
        return React.cloneElement(children, {}, staggered);
      }
    }

    return (
      <div
        className={isVisible ? "reveal-visible" : "reveal-init"}
        style={delay ? { animationDelay: `${delay}s` } : undefined}
      >
        {children}
      </div>
    );
  };

  return (
    <div ref={ref} style={width ? { width } : undefined} className={className}>
      {renderContent()}
    </div>
  );
};

export default Reveal;
