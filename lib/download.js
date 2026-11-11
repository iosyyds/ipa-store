'use client';
import { useRouter } from 'next/navigation';
import { API } from './api';
import { isLoggedIn } from './auth';
import { useSheet } from '@/components/SheetProvider';
import { useToast } from '@/components/ToastProvider';

export const isIOS = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isWeChat = () => /micromessenger/i.test(navigator.userAgent);

export function useDownload() {
  const sheet = useSheet();
  const toast = useToast();
  const router = useRouter();

  function currentPath() {
    return window.location.pathname + window.location.search;
  }

  function promptLogin() {
    sheet.show({
      title: '请先登录',
      subtitle: '登录后即可下载或安装该应用',
      actions: [
        {
          label: '登录 / 注册',
          primary: true,
          onClick: () =>
            router.push('/login?redirect=' + encodeURIComponent(currentPath())),
        },
      ],
    });
  }

  function handleToken(data, app) {
    if (isWeChat()) {
      sheet.show({
        title: '请在 Safari 中打开',
        subtitle: '微信内无法直接安装，请点击右上角「···」选择「在 Safari 中打开」后再试。',
        actions: [{ label: '我知道了', primary: true }],
      });
      return;
    }
    if (isIOS()) {
      sheet.show({
        title: '选择安装方式',
        subtitle: app ? app.name : '',
        actions: [
          {
            label: '直接安装（企业签名）',
            primary: true,
            onClick: () => {
              const manifest = data.manifest_url;
              if (!manifest) return toast('未获取到安装清单', 'error');
              window.location.href = 'itms-services://?action=download-manifest&url=' + encodeURIComponent(manifest);
            },
          },
          {
            label: '下载 IPA 文件',
            onClick: () => {
              if (!data.download_url) return toast('未获取到下载地址', 'error');
              window.open(data.download_url, '_blank');
            },
          },
        ],
      });
      return;
    }
    if (!data.download_url) return toast('未获取到下载地址', 'error');
    window.open(data.download_url, '_blank');
  }

  async function startDownload(app) {
    if (!app || !app.id) return;
    if (!isLoggedIn()) return promptLogin();
    try {
      const data = await API.user.appToken(app.id);
      handleToken(data, app);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return { startDownload, promptLogin, isIOS, isWeChat };
}
