'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { isLoggedIn, clearSession } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';

const STATUS_MAP = {
  signed: { label: '已签名', cls: 'tag-green' },
  processing: { label: '签名中', cls: 'tag-blue' },
  uploaded: { label: '待签名', cls: 'tag-gray' },
  failed: { label: '失败', cls: 'tag-red' },
  expired: { label: '已过期', cls: 'tag-gray' },
};

// 文件选择行：按钮 + 已选文件名
function FilePick({ accept, label, hint, fileName, onPick, disabled }) {
  const ref = useRef(null);
  return (
    <div className="sign-file">
      <button className="sign-file-btn" type="button" disabled={disabled} onClick={() => ref.current?.click()}>
        {label}
      </button>
      <span className="sign-file-name" title={fileName || hint}>
        {fileName || hint}
      </span>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(e) => { onPick(e.target.files?.[0] || null); e.target.value = ''; }}
      />
    </div>
  );
}

export default function SignPage() {
  const router = useRouter();
  const toast = useToast();

  const [access, setAccess] = useState('loading'); // loading/locked/ready
  const [tab, setTab] = useState('sign');

  // 签名流程
  const [ipaName, setIpaName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [task, setTask] = useState(null);
  const [p12Name, setP12Name] = useState('');
  const [p12File, setP12File] = useState(null);
  const [mpName, setMpName] = useState('');
  const [mpFile, setMpFile] = useState(null);
  const [password, setPassword] = useState('');
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState(null);

  // 记录
  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  // 门禁：未登录跳登录；已登录检查有效授权
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login?redirect=' + encodeURIComponent('/sign'));
      return;
    }
    let alive = true;
    (async () => {
      try {
        const r = await API.sign.access();
        if (alive) setAccess(r.can_sign ? 'ready' : 'locked');
      } catch (e) {
        if (!alive) return;
        if (e.status === 401 || e.code === 401) {
          clearSession();
          router.replace('/login?redirect=' + encodeURIComponent('/sign'));
          return;
        }
        setAccess('locked');
      }
    })();
    return () => { alive = false; };
  }, [router]);

  async function loadRecords() {
    try {
      setRecords(await API.sign.records());
      setRecordsLoaded(true);
    } catch (e) { toast(e.message, 'error'); }
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'records' && !recordsLoaded) loadRecords();
  }

  // 步骤 1：选择并上传 IPA
  async function onPickIpa(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.ipa')) { toast('请选择 .ipa 文件', 'error'); return; }
    setIpaName(f.name);
    setTask(null);
    setResult(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('ipa', f);
      setTask(await API.sign.uploadIpa(fd));
    } catch (e) {
      toast(e.message, 'error');
      setIpaName('');
    } finally { setUploading(false); }
  }

  // 步骤 4：执行签名
  async function onSign() {
    if (uploading) return toast('IPA 仍在上传中', 'error');
    if (!task) return toast('请先上传 IPA', 'error');
    if (!p12File) return toast('请选择证书 .p12 文件', 'error');
    if (!mpFile) return toast('请选择描述文件 .mobileprovision', 'error');
    setSigning(true);
    try {
      const fd = new FormData();
      fd.append('task_no', task.task_no);
      fd.append('p12', p12File);
      fd.append('mobileprovision', mpFile);
      fd.append('password', password);
      const data = await API.sign.execute(fd);
      setResult(data);
      setRecordsLoaded(false);
      toast('签名成功', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally { setSigning(false); }
  }

  function resetAll() {
    setIpaName(''); setTask(null); setP12Name(''); setP12File(null);
    setMpName(''); setMpFile(null); setPassword(''); setResult(null);
  }

  async function onDownload(taskNo, name) {
    try {
      await API.sign.download(taskNo, (name ? name.replace(/\.ipa$/i, '') : 'signed') + '-signed.ipa');
    } catch (e) { toast(e.message, 'error'); }
  }

  if (access === 'loading') return <div className="empty">加载中…</div>;

  if (access === 'locked') {
    return (
      <div className="accounts-wrap">
        <div className="account-lock">
          <span className="account-lock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
              <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
              <circle cx="12" cy="15.5" r="1.4" />
              <path d="M12 16.9v1.6" />
            </svg>
          </span>
          <h2 className="account-lock-title">自助签名需要授权</h2>
          <p className="account-lock-desc">你还没有有效授权码，兑换后即可使用自助签名，对 IPA 进行重签名。</p>
          <div className="account-lock-actions">
            <button className="btn btn-primary" onClick={() => router.push('/user?redirect=' + encodeURIComponent('/sign'))}>
              去兑换授权码
            </button>
            <button className="btn btn-ghost" onClick={() => router.push('/')}>返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="accounts-wrap">
      <h1 className="accounts-title">自助签名</h1>
      <p className="accounts-sub">上传 IPA 与签名证书，在线完成重签名</p>

      <div className="seg sign-seg">
        <button className={tab === 'sign' ? 'active' : ''} onClick={() => switchTab('sign')}>自助签名</button>
        <button className={tab === 'records' ? 'active' : ''} onClick={() => switchTab('records')}>签名记录</button>
      </div>

      {tab === 'sign' && (
        <div className="sign-steps">
          {/* 步骤 1：上传 IPA */}
          <section className="card sign-card">
            <div className="sign-step-head">
              <span className="sign-step-no">1</span>
              <strong>上传 IPA</strong>
            </div>
            <FilePick
              accept=".ipa"
              label="选择 IPA 文件"
              hint="未选择文件"
              fileName={uploading ? `${ipaName}（上传中…）` : ipaName}
              onPick={onPickIpa}
              disabled={uploading || signing}
            />
          </section>

          {/* 步骤 2：应用信息 */}
          <section className="card sign-card">
            <div className="sign-step-head">
              <span className="sign-step-no">2</span>
              <strong>应用信息</strong>
            </div>
            {task ? (
              <div className="sign-meta">
                <div><span>名称</span><b>{task.app_name || '—'}</b></div>
                <div><span>Bundle ID</span><b>{task.bundle_id || '—'}</b></div>
                <div><span>版本</span><b>{task.version || '—'}{task.build ? ` (${task.build})` : ''}</b></div>
              </div>
            ) : (
              <p className="sign-placeholder">IPA 上传成功后自动识别应用信息</p>
            )}
          </section>

          {/* 步骤 3：签名证书 */}
          <section className="card sign-card">
            <div className="sign-step-head">
              <span className="sign-step-no">3</span>
              <strong>签名证书</strong>
            </div>
            <FilePick
              accept=".p12,.pfx"
              label="选择证书"
              hint="p12 / pfx 文件"
              fileName={p12Name}
              onPick={(f) => { setP12File(f); setP12Name(f ? f.name : ''); }}
              disabled={signing}
            />
            <FilePick
              accept=".mobileprovision"
              label="选择描述文件"
              hint="mobileprovision 文件"
              fileName={mpName}
              onPick={(f) => { setMpFile(f); setMpName(f ? f.name : ''); }}
              disabled={signing}
            />
            <input
              className="input sign-pass"
              type="password"
              placeholder="证书密码（无密码可留空）"
              value={password}
              autoComplete="off"
              disabled={signing}
              onChange={(e) => setPassword(e.target.value)}
            />
          </section>

          {/* 步骤 4：执行签名 */}
          <section className="sign-action">
            {result ? (
              <div className="sign-result">
                <div className="sign-result-head">
                  <span className="sign-result-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <strong>签名成功</strong>
                    <p>文件将保留 3 小时，请尽快下载</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-block" onClick={() => onDownload(result.task_no, task?.original_name)}>
                  下载签名后的 IPA
                </button>
                <button className="btn btn-ghost btn-block" onClick={resetAll}>再签一个</button>
              </div>
            ) : (
              <button className="btn btn-primary btn-block" disabled={signing || uploading} onClick={onSign}>
                {signing ? '签名中，请稍候…' : '执行签名'}
              </button>
            )}
          </section>
        </div>
      )}

      {tab === 'records' && (
        <div className="sign-records">
          {!records.length ? (
            <p className="sign-placeholder">暂无签名记录</p>
          ) : (
            records.map((r) => {
              const st = STATUS_MAP[r.status] || STATUS_MAP.uploaded;
              return (
                <div key={r.task_no} className="sign-record">
                  <div className="sign-record-main">
                    <strong>{r.original_name || r.app_name || 'IPA 文件'}</strong>
                    {r.bundle_id && <p>{r.bundle_id}</p>}
                    {r.status === 'failed' && r.error_msg && <p className="sign-record-err">{r.error_msg}</p>}
                    <span className="sign-record-time">{r.created_at}</span>
                  </div>
                  <div className="sign-record-side">
                    <span className={'tag ' + st.cls}>{st.label}</span>
                    {r.status === 'signed' && (
                      <button className="sign-dl-btn" onClick={() => onDownload(r.task_no, r.original_name)}>
                        下载
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
