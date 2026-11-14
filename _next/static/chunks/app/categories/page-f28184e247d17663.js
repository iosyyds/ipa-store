(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [457],
  {
    215: function (e, t, r) {
      Promise.resolve().then(r.bind(r, 7980));
    },
    7980: function (e, t, r) {
      "use strict";
      (r.r(t),
        r.d(t, {
          default: function () {
            return d;
          },
        }));
      var s = r(7437),
        a = r(2265),
        n = r(9376),
        o = r(6448);
      let c = (0, s.jsxs)("svg", {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.7",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          (0, s.jsx)("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.6" }),
          (0, s.jsx)("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.6" }),
          (0, s.jsx)("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.6" }),
          (0, s.jsx)("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.6" }),
        ],
      });
      function i(e) {
        let { c: t } = e;
        if (t.icon) {
          let e = /^https?:\/\//i.test(t.icon) ? t.icon : o.API.fileUrl(t.icon);
          return (0, s.jsx)("img", { src: e, alt: "" });
        }
        return c;
      }
      function d() {
        let e = (0, n.useRouter)(),
          [t, r] = (0, a.useState)(null),
          [c, d] = (0, a.useState)(!1);
        return (
          (0, a.useEffect)(() => {
            (async () => {
              try {
                let e = await o.API.categories(),
                  t = e.reduce((e, t) => e + Number(t.app_count || 0), 0),
                  s = [{ id: "", name: "全部应用", app_count: t, grad: "cat-grad-0" }];
                (e.forEach((e, t) => {
                  s.push({ ...e, grad: "cat-grad-".concat((t + 1) % 12) });
                }),
                  r(s));
              } catch (e) {
                d(!0);
              }
            })();
          }, []),
          (0, s.jsxs)("main", {
            className: "cat-page",
            children: [
              (0, s.jsxs)("div", {
                className: "cat-page-head",
                children: [
                  (0, s.jsx)("h1", { children: "类别" }),
                  (0, s.jsx)("p", { children: "按分类浏览精选应用" }),
                ],
              }),
              c
                ? (0, s.jsxs)("div", {
                    className: "today-empty",
                    children: [
                      (0, s.jsx)("div", { children: "无法连接数据接口" }),
                      (0, s.jsx)("div", {
                        style: { marginTop: 8, fontSize: 13 },
                        children: "请稍后重试或检查后端服务",
                      }),
                    ],
                  })
                : null === t
                  ? (0, s.jsx)("div", { className: "today-empty", children: "加载中…" })
                  : t.length <= 1
                    ? (0, s.jsx)("div", {
                        className: "today-empty",
                        children: "暂无分类，请到后台添加应用并设置分类",
                      })
                    : (0, s.jsx)("div", {
                        className: "cat-grid",
                        children: t.map((t) =>
                          (0, s.jsxs)(
                            "div",
                            {
                              className: "cat-card " + t.grad,
                              onClick: () =>
                                e.push("/category?id=".concat(encodeURIComponent(t.id))),
                              children: [
                                (0, s.jsx)("div", {
                                  className: "cat-card-icon",
                                  children: (0, s.jsx)(i, { c: t }),
                                }),
                                (0, s.jsx)("div", { className: "cat-card-name", children: t.name }),
                                (0, s.jsx)("div", {
                                  className: "cat-card-count",
                                  children:
                                    null != t.app_count ? "".concat(t.app_count, " 款应用") : "",
                                }),
                              ],
                            },
                            t.id,
                          ),
                        ),
                      }),
            ],
          })
        );
      }
    },
    6448: function (e, t, r) {
      "use strict";
      (r.r(t),
        r.d(t, {
          API: function () {
            return i;
          },
        }));
      let s = "https://ipaht.puaaa.cn",
        a = s + "/api";
      function n() {
        return window.localStorage.getItem("ipa_token");
      }
      async function o(e) {
        let t,
          r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
          s = { Accept: "application/json" };
        !r.body || r.body instanceof FormData || (s["Content-Type"] = "application/json");
        let o = n();
        o && (s.Authorization = "Bearer " + o);
        try {
          t = await fetch(a + e, { ...r, headers: s });
        } catch (e) {
          throw Error("网络连接失败，请检查网络后重试");
        }
        let c = null,
          i = await t.text();
        if (i)
          try {
            c = JSON.parse(i);
          } catch (e) {
            if (404 === t.status) throw Error("内容不存在或已下架");
            if (403 === t.status) throw Error("没有权限访问该内容");
            if (t.status >= 500) throw Error("服务器暂时不可用，请稍后再试");
            throw Error("服务器返回数据格式错误");
          }
        if (!t.ok || (c && 0 !== c.code)) {
          let e = Error((c && c.message) || "请求失败（" + t.status + "）");
          throw ((e.status = t.status), (e.code = c ? c.code : t.status), e);
        }
        return c ? c.data : null;
      }
      function c(e) {
        let t = new URLSearchParams();
        Object.entries(e || {}).forEach((e) => {
          let [r, s] = e;
          null != s && "" !== s && t.append(r, s);
        });
        let r = t.toString();
        return r ? "?" + r : "";
      }
      let i = {
        settings: () => o("/settings"),
        categories: () => o("/categories"),
        apps: (e) => o("/apps" + c(e)),
        app: (e) => o("/apps/" + encodeURIComponent(e)),
        register: (e) => o("/register", { method: "POST", body: JSON.stringify(e) }),
        login: (e) => o("/login", { method: "POST", body: JSON.stringify(e) }),
        wxTicket: () => o("/wxlogin/ticket", { method: "POST" }),
        wxCheck: (e) => o("/wxlogin/check" + c({ ticket: e })),
        wxQrUrl: (e) => (e ? s + e : ""),
        fileUrl: (e) => (e ? (e.startsWith("http") ? e : s + "/" + e.replace(/^\/+/, "")) : ""),
        user: {
          profile: () => o("/user/profile"),
          licenses: () => o("/user/licenses"),
          logs: () => o("/user/logs"),
          redeem: (e) => o("/user/redeem", { method: "POST", body: JSON.stringify({ code: e }) }),
          password: (e) => o("/user/change-password", { method: "POST", body: JSON.stringify(e) }),
          appToken: (e) => o("/user/apps/" + encodeURIComponent(e) + "/token", { method: "POST" }),
        },
        sign: {
          access: () => o("/user/sign/access"),
          records: () => o("/user/sign/records"),
          uploadIpa: (e) => o("/user/sign/ipa", { method: "POST", body: e }),
          execute: (e) => o("/user/sign/execute", { method: "POST", body: e }),
          async download(e, t) {
            let r = await fetch(a + "/user/sign/download/" + encodeURIComponent(e), {
              headers: { Authorization: "Bearer " + n() },
            });
            if (!r.ok) {
              let e = "下载失败";
              try {
                let t = await r.json();
                t && t.message && (e = t.message);
              } catch (e) {}
              throw Error(e);
            }
            let s = await r.blob(),
              o = URL.createObjectURL(s),
              c = document.createElement("a");
            ((c.href = o),
              (c.download = t || "signed.ipa"),
              document.body.appendChild(c),
              c.click(),
              c.remove(),
              setTimeout(() => URL.revokeObjectURL(o), 4e3));
          },
        },
      };
    },
    9376: function (e, t, r) {
      "use strict";
      var s = r(5475);
      (r.o(s, "usePathname") &&
        r.d(t, {
          usePathname: function () {
            return s.usePathname;
          },
        }),
        r.o(s, "useRouter") &&
          r.d(t, {
            useRouter: function () {
              return s.useRouter;
            },
          }),
        r.o(s, "useSearchParams") &&
          r.d(t, {
            useSearchParams: function () {
              return s.useSearchParams;
            },
          }));
    },
  },
  function (e) {
    (e.O(0, [971,117, 744], function () {
      return e((e.s = 215));
    }),
      (_N_E = e.O()));
  },
]);
