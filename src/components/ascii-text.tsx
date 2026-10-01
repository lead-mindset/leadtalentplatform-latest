"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "!<>-_\\/[]{}—=+*^?#________";

export function AsciiText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  const scramble = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let iteration = 0;
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) =>
            char === " " ? " " : i < iteration ? text[i] : CHARS[Math.floor(Math.random() * CHARS.length)]
          )
          .join("")
      );
      iteration += 1 / 3;
      if (iteration >= text.length && intervalRef.current) clearInterval(intervalRef.current);
    }, 30);
  };

  return (
    <span onMouseEnter={scramble} className={className} aria-label={text}>
      {display}
    </span>
  );
}