'use client';
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined') console.error('页面渲染异常：', error, info);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  handleHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <div className="error-fallback-card">
            <div className="error-fallback-icon">!</div>
            <h2>页面出了点小问题</h2>
            <p>请尝试刷新页面，或返回首页继续浏览。</p>
            <div className="error-fallback-actions">
              <button className="btn btn-primary" onClick={this.handleReload}>刷新页面</button>
              <button className="btn btn-ghost" onClick={this.handleHome}>返回首页</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
