'use client';
import { useLayoutEffect, useRef, useState } from 'react';

export default function NoticeBar({ text }) {
  const scrollRef = useRef(null);
  const textRef = useRef(null);
  const [canExpand, setCanExpand] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    if (textRef.current && scrollRef.current) {
      setCanExpand(textRef.current.scrollWidth > scrollRef.current.clientWidth + 2);
    }
  }, [text]);

  if (!text) return null;

  return (
    <div
      className={'notice-bar' + (canExpand ? ' can-expand' : '') + (expanded ? ' expanded' : '')}
      onClick={() => canExpand && setExpanded((v) => !v)}
    >
      <span className="notice-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
          <path d="M16 8.5a5 5 0 0 1 0 7" />
        </svg>
      </span>
      <div className="notice-scroll" ref={scrollRef}>
        <span className="notice-text" ref={textRef}>{text}</span>
      </div>
      <span className="notice-chevron" hidden={!canExpand}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
