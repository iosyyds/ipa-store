'use client';
import { useState } from 'react';
import { API } from '@/lib/api';
import { firstChar } from '@/lib/utils';

export default function Icon({ app, className = 'feed-icon' }) {
  const [failed, setFailed] = useState(false);
  const src = app && app.icon ? API.fileUrl(app.icon) : '';
  const showPh = !src || failed;
  return (
    <div className={className + (showPh ? ' ph' : '')}>
      {!showPh && (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      )}
      <span className="ph-letter">{firstChar(app && app.name)}</span>
    </div>
  );
}
