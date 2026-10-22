"use client";

import { useEffect, useState } from "react";

export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = new Set(
          entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => entry.target.id),
        );
        if (visible.size === 0) return;
        const next = ids.find((id) => visible.has(id));
        if (next) setActive(next);
      },
      {
        rootMargin: "-16% 0px -68% 0px",
        threshold: 0,
      },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
