import { useLayoutEffect } from "react";

export default function useScrollReveal(rootRef, refreshKey) {
  useLayoutEffect(() => {
    const root = rootRef.current;

    if (
      !root ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return undefined;
    }

    const targets = root.querySelectorAll("[data-scroll-reveal]");
    if (!targets.length) {
      return undefined;
    }

    root.classList.add("scroll-reveal-ready");

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.12 },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      root.classList.remove("scroll-reveal-ready");
    };
  }, [rootRef, refreshKey]);
}
