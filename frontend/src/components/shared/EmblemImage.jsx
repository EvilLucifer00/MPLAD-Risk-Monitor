import React from 'react';

/**
 * EmblemImage delivers next-gen AVIF images to modern supporting browsers,
 * gracefully falling back to WebP and PNG for full cross-browser compatibility.
 */
export const EmblemImage = ({
  width = 40,
  height = 48,
  className = "w-10 h-12 object-contain shrink-0",
  alt = "Emblem of India",
  loading = "lazy",
  priority = false
}) => {
  return (
    <picture className="inline-flex shrink-0 items-center justify-center">
      <source 
        type="image/avif" 
        srcSet="/images/emblem-small.avif 80w, /images/emblem.avif 120w"
        sizes="(max-width: 640px) 40px, 48px"
      />
      <source 
        type="image/webp" 
        srcSet="/images/emblem-small.webp 80w, /images/emblem.webp 120w"
        sizes="(max-width: 640px) 40px, 48px"
      />
      <img
        src="/images/emblem.png"
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : loading}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={className}
      />
    </picture>
  );
};

export default EmblemImage;
