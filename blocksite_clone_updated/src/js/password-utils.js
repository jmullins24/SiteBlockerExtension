// Function to check password before unblocking
function checkPasswordBeforeUnblocking(hostname, callback) {
  chrome.storage.sync.get(['passwordProtection'], function(result) {
    // If password protection is not enabled, proceed without checking
    if (!result.passwordProtection || !result.passwordProtection.enabled) {
      callback(true);
      return;
    }
    
    // Create password prompt dialog
    const passwordPrompt = document.createElement('div');
    passwordPrompt.className = 'password-prompt-overlay';
    
    passwordPrompt.innerHTML = `
      <div class="password-prompt-container">
        <h3>Password Required</h3>
        <p>Enter your password to unblock this site:</p>
        <input type="password" id="password-input" class="password-input">
        <div class="password-buttons">
          <button id="cancel-btn" class="btn secondary-btn">Cancel</button>
          <button id="submit-btn" class="btn primary-btn">Submit</button>
        </div>
        <p id="password-error" class="password-error hidden">Incorrect password. Please try again.</p>
      </div>
    `;
    
    document.body.appendChild(passwordPrompt);
    
    // Add styles for the password prompt
    const style = document.createElement('style');
    style.textContent = `
      .password-prompt-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .password-prompt-container {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        width: 80%;
        max-width: 300px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      
      .password-prompt-container h3 {
        margin-top: 0;
        color: #333;
      }
      
      .password-input {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .password-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
      }
      
      .password-error {
        color: #e74c3c;
        margin-top: 10px;
        font-size: 14px;
      }
      
      .hidden {
        display: none;
      }
    `;
    
    document.head.appendChild(style);
    
    // Focus on password input
    const passwordInput = document.getElementById('password-input');
    passwordInput.focus();
    
    // Handle submit button click
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.addEventListener('click', function() {
      const password = passwordInput.value;
      
      // Check password with background script
      chrome.runtime.sendMessage(
        { action: 'checkPassword', password: password },
        function(response) {
          if (response && response.success) {
            // Password correct, remove prompt and proceed
            document.body.removeChild(passwordPrompt);
            callback(true);
          } else {
            // Password incorrect, show error
            const passwordError = document.getElementById('password-error');
            passwordError.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
          }
        }
      );
    });
    
    // Handle cancel button click
    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn.addEventListener('click', function() {
      document.body.removeChild(passwordPrompt);
      callback(false);
    });
    
    // Handle Enter key in password input
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        submitBtn.click();
      }
    });
  });
}
