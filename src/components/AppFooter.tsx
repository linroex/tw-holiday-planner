/** 社群連結列：頁尾、分享面板、使用說明共用（單一來源） */
export function SocialLinks() {
  return (
    <div className="footer-links">
      <a
        href="https://github.com/linroex/tw-holiday-planner"
        target="_blank"
        rel="noreferrer"
        className="about-link footer-link"
      >
        ⭐️ GitHub
      </a>
      <a
        href="https://www.facebook.com/linroex"
        target="_blank"
        rel="noreferrer"
        className="about-link footer-link"
      >
        👍 Facebook
      </a>
      <a
        href="https://www.threads.com/@linroex"
        target="_blank"
        rel="noreferrer"
        className="about-link footer-link"
      >
        🧵 Threads
      </a>
    </div>
  );
}

/** 頁尾：隱私聲明＋關於／社群連結（月曆捲到底的慣例位置） */
export function AppFooter() {
  return (
    <footer className="app-footer">
      <p className="footer-privacy">
        <b>隱私：</b>所有規劃資料只儲存在你自己的裝置上（瀏覽器
        localStorage）——沒有伺服器、不上傳、不追蹤。分享連結是把資料放進網址裡，給不給人由你決定。
      </p>
      <p className="footer-about">
        開源小工具，覺得好用歡迎給顆 ⭐️、追蹤作者看更新，或開 issue 許願新功能：
      </p>
      <SocialLinks />
    </footer>
  );
}
