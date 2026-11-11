'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const SheetContext = createContext(null);

export function SheetProvider({ children }) {
  const [cfg, setCfg] = useState(null);

  const close = useCallback(() => setCfg(null), []);

  const show = useCallback((opts) => {
    setCfg({ cancelLabel: '取消', ...opts });
  }, []);

  function handleAction(act) {
    setCfg(null);
    if (act && typeof act.onClick === 'function') act.onClick();
  }

  return (
    <SheetContext.Provider value={{ show, close }}>
      {children}
      {cfg && (
        <div className="mask" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="sheet" role="dialog" aria-modal="true">
            <div className="sheet-head">
              <h3>{cfg.title}</h3>
              {cfg.subtitle && <p>{cfg.subtitle}</p>}
            </div>
            <div className="sheet-body">
              {(cfg.actions || []).map((act, i) => (
                <button
                  key={i}
                  className={'btn btn-block ' + (act.primary ? 'btn-primary' : 'btn-ghost')}
                  onClick={() => handleAction(act)}
                >
                  {act.label}
                </button>
              ))}
            </div>
            <div className="sheet-foot">
              <button type="button" onClick={close}>{cfg.cancelLabel}</button>
            </div>
          </div>
        </div>
      )}
    </SheetContext.Provider>
  );
}

export function useSheet() {
  return useContext(SheetContext);
}
