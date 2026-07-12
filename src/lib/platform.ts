/** iOS（含 iPadOS 桌面版 UA：Mac + 觸控） */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1)
  );
}

/**
 * 受 Safari ITP 七天清除規則影響的環境：
 * iOS 上所有瀏覽器（都是 WebKit）＋ macOS 的 Safari 本體。
 */
export function isSafariITP(): boolean {
  if (isIOS()) return true;
  const ua = navigator.userAgent;
  return (
    ua.includes('Macintosh') &&
    ua.includes('Safari') &&
    !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua)
  );
}

