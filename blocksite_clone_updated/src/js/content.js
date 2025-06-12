// Content script for BlockSite Clone extension
// This script runs on all web pages to handle blocking and UI modifications

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkBlocked') {
    // This page is being checked for blocking
    // We could add additional client-side checks here if needed
    sendResponse({ status: 'checked' });
  }
});

// Function to inject block notification if needed
function injectBlockNotification() {
  // This could be used to show a temporary notification
  // before redirecting to the blocked page
  const notification = document.createElement('div');
  notification.className = 'blocksite-notification';
  notification.innerHTML = `
    <div class="blocksite-notification-content">
      <img src="${chrome.runtime.getURL('images/icon48.png')}" alt="BlockSite Clone Logo">
      <p>This site is blocked by BlockSite Clone</p>
      <p>Redirecting...</p>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .blocksite-notification {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .blocksite-notification-content {
      background-color: #e74c3c;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      max-width: 400px;
    }
    
    .blocksite-notification-content img {
      width: 48px;
      height: 48px;
      margin-bottom: 10px;
    }
    
    .blocksite-notification-content p {
      margin: 10px 0;
      font-size: 16px;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(notification);
  
  // Remove after a short delay (the background script will handle the actual redirect)
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// This could be triggered by a message from the background script if needed
// For now, we'll leave it as a function that can be called
