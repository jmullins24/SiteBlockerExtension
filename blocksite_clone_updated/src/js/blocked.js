document.addEventListener('DOMContentLoaded', function() {
  const disableBlockingBtn = document.getElementById('disable-blocking-btn');
  const goBackBtn = document.getElementById('go-back-btn');
  const passwordForm = document.getElementById('password-form');
  const passwordInput = document.getElementById('password-input');
  const submitPasswordBtn = document.getElementById('submit-password-btn');
  const errorMessage = document.getElementById('error-message');

  // Check if password protection is enabled
  chrome.storage.sync.get(['passwordProtection'], function(result) {
    if (result.passwordProtection && result.passwordProtection.enabled) {
      disableBlockingBtn.addEventListener('click', function() {
        passwordForm.style.display = 'block';
        disableBlockingBtn.style.display = 'none';
      });

      submitPasswordBtn.addEventListener('click', function() {
        const password = passwordInput.value;

        chrome.runtime.sendMessage({
          action: 'checkPassword',
          password: password
        }, function(response) {
          if (response && response.success) {
            // Password correct, disable blocking
            chrome.storage.sync.set({ isEnabled: false }, function() {
              // Go back to previous page
              history.back();
            });
          } else {
            // Password incorrect
            errorMessage.style.display = 'block';
            passwordInput.value = '';
          }
        });
      });
    } else {
      // No password protection, disable blocking immediately
      disableBlockingBtn.addEventListener('click', function() {
        chrome.storage.sync.set({ isEnabled: false }, function() {
          // Go back to previous page
          history.back();
        });
      });
    }
  });

  goBackBtn.addEventListener('click', function() {
    history.back();
  });
});
