# 建立 GitHub repo 與發布遊戲

目前專案已有可發布的靜態檔案與 `.github/workflows/pages.yml`，不需要自行架設後端。GitHub Pages 提供玩家下載遊戲檔案的公開網址。

## 1. 建立公開儲存庫

1. 登入 GitHub，開啟 <https://github.com/new>。
2. Repository name 建議填入 `together-safe`。
3. Description 可填：`今天，也要一起平安｜給一般民眾與家人的互動安全情境遊戲`。
4. Visibility 選擇 **Public**。
5. 不另外產生 README、.gitignore 或 License，因為專案已有文件。
6. 點擊 **Create repository**。

參考：[GitHub 官方建立儲存庫教學](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)。

## 2. 上傳遊戲檔案

### 方法 A：使用 GitHub 網頁

1. 在新儲存庫首頁點擊 **uploading an existing file**；已有檔案時使用 **Add file → Upload files**。
2. 打開本機 `together-safe` 資料夾，把**裡面的檔案與子資料夾**拖入上傳區。若使用 ZIP，請先解壓縮。
3. macOS Finder 按 `Command + Shift + .` 顯示隱藏項目，確認 `.github` 也包含在上傳內容。
4. 確認 `index.html` 與 `README.md` 在儲存庫根目錄，不是多包一層 `together-safe/`。
5. 輸入提交訊息，例如 `Publish first playable version`，點擊 **Commit changes**。
6. 本專案工作流程使用 `main` 分支；若你的預設分支名稱不同，請將工作流程的 `branches: [main]` 改成實際分支。

上傳後應看到：

```text
.github/workflows/pages.yml
content.js
docs/DEPLOYMENT.md
game.js
icon.svg
index.html
LICENSE
manifest.webmanifest
package.json
README.md
scripts/build-standalone.mjs
SOURCES.md
style.css
sw.js
tests/
一起平安-離線版.html
```

外層參考用 PDF、ZIP 檔不需要放入儲存庫。

參考：[GitHub 官方檔案上傳教學](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)。

### 方法 B：使用終端機

如果你已設定 Git 與 GitHub 登入，可以在本機專案資料夾執行以下指令。先將網址中的 `YOUR_USERNAME` 換成自己的 GitHub 帳號；以下步驟適用於尚未初始化 Git、且遠端儲存庫為空的本專案資料夾。

```sh
cd "/Users/harryhsiao/Desktop/全民國防/together-safe"
git init -b main
git add .
git commit -m "Publish first playable version"
git remote add origin https://github.com/YOUR_USERNAME/together-safe.git
git push -u origin main
```

若終端機尚未設定 GitHub 認證，先採用網頁上傳方法即可。

## 3. 啟用 GitHub Pages

1. 在儲存庫開啟 **Settings → Pages**。
2. 在 **Build and deployment → Source** 選擇 **GitHub Actions**。
3. 專案已內附工作流程，不需要另外建立網站範本。
4. 到 **Actions**，選擇 **Publish game to GitHub Pages**，點擊 **Run workflow**，選擇 `main` 後執行。
5. 等待流程成功。工作流程會產生單檔版、執行測試，然後部署公開資產。

第一次上傳時，如果尚未啟用 Pages 而導致工作流程失敗，完成上述設定後重新執行即可。

參考：[GitHub 官方 Pages 發布來源設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 4. 取得並分享網址

部署成功後，可在 **Settings → Pages** 的 **Visit site**，或 Actions 部署結果取得實際網址。

一般專案網址形式為：

```text
https://YOUR_USERNAME.github.io/together-safe/
```

這是格式範例，並非目前已存在的遊戲網址。請以 GitHub 部署結果為準。取得網址後，把 README 開頭的「尚未發布」說明改成實際遊戲連結，也可在儲存庫右側 About 設定 Website。

玩家開啟這個網址即可遊玩，不需 GitHub 帳號。網頁底部也有單檔離線版下載入口。

## 5. 發布後的確認

- 電腦與手機都能進入遊戲，點擊與方向鍵正常。
- 至少完成一局，確認對話、結局及重新整理後的存檔。
- 下載單檔版後，在電腦離線開啟遊玩。
- 網頁版完成首次快取後，測試離線重新開啟。
- 更新 README 的遊戲網址與實際驗證狀態。

## 常見問題

**只有 GitHub 程式碼頁面，沒有遊戲？**

儲存庫網址 `github.com/...` 用來管理程式碼；玩家需要的是部署成功後的 `github.io/...` 網址。

**Actions 沒有看到發布工作流程？**

檢查 `.github/workflows/pages.yml` 是否確實上傳，且位於根目錄。Finder 預設會隱藏 `.github`。

**工作流程失敗？**

開啟 Actions 中失敗的流程與紅色步驟，查看錯誤內容。先確認 Pages 的 Source 為 GitHub Actions、`scripts/` 與 `tests/` 已上傳、分支名稱與設定一致。

**網址顯示 404？**

先確認部署已成功，再使用 Settings → Pages 提供的網址。檢查 `index.html` 是否位於儲存庫根目錄，並確認網址包含正確的儲存庫名稱。

**更新了程式，離線版還是舊版？**

執行 `npm run build` 重新打包。GitHub 工作流程也會在部署時打包。若網頁離線快取尚未更新，連網重新載入，並確認 `sw.js` 快取版本已更新。
