# IPA 下载站前台（GitHub Pages 部署）

纯静态页面，无构建步骤，Apple App Store 风格，移动端 / 桌面端自适应。

## 页面

- `index.html`：首页，搜索、分类筛选、应用列表、加载更多
- `app.html`：应用详情，截图预览、更新说明、底部下载栏
- `assets/js/config.js`：**唯一需要修改的文件**，配置后端地址

## 部署到 GitHub Pages

### 1. 修改接口地址

打开 `assets/js/config.js`，改成你的宝塔后端域名：

```js
window.API_BASE = 'https://api.example.com';
```

### 2. 上传到 GitHub

方式一（网页）：新建仓库 → 上传本目录全部文件（含 `.nojekyll`）。

方式二（Git 命令）：

```bash
git init
git add .
git commit -m "init ipa store frontend"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 3. 开启 Pages

仓库 → **Settings → Pages**：

- Source 选 **Deploy from a branch**
- Branch 选 **main**，目录选 **/ (root)**
- 点击 **Save**

等待一两分钟，访问：

```
https://你的用户名.github.io/仓库名/
```

### 4. 绑定自己的域名（可选）

1. 仓库根目录新建 `CNAME` 文件，内容为你的域名（如 `ipa.example.com`）。
2. 域名 DNS 加 CNAME 记录指向 `你的用户名.github.io`。
3. Pages 设置页勾选 **Enforce HTTPS**。

### 5. 后端配合

后端 `.env` 的 `CORS_ORIGIN` 必须包含你的前台域名，例如：

```ini
CORS_ORIGIN=https://你的用户名.github.io,https://ipa.example.com
```

## 说明

- iPhone 上点击「获取」会弹出「直接安装 / 下载 IPA」；直接安装走企业签名
  `itms-services`，必须用 Safari 打开（微信内会提示跳转）。
- 桌面浏览器点击「获取」直接下载 `.ipa` 文件。
- 授权应用会先弹窗要求输入授权码，验证通过后才发放下载链接。
