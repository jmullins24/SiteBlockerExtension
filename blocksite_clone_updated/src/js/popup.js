// Modified popup script for BlockSite Clone extension with password protection for unblocking

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const blockingToggle = document.getElementById('blocking-toggle');
  const focusModeToggle = document.getElementById('focus-mode-toggle');
  const siteFavicon = document.getElementById('site-favicon');
  const currentSiteElement = document.getElementById('current-site');
  const blockCurrentSiteButton = document.getElementById('block-current-site');
  const viewBlockedSitesButton = document.getElementById('view-blocked-sites');
  const openOptionsButton = document.getElementById('open-options');
  const viewInsightsButton = document.getElementById('view-insights');
  const sitesBlockedCount = document.getElementById('sites-blocked-count');
  const timeSavedElement = document.getElementById('time-saved');
  
  // Load current settings
  chrome.storage.sync.get(['isEnabled', 'focusModeEnabled', 'blockedSites'], function(result) {
    blockingToggle.checked = result.isEnabled !== false;
    focusModeToggle.checked = result.focusModeEnabled === true;
  });
  
  // Get current tab URL and favicon
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      const url = new URL(tabs[0].url);
      currentSiteElement.textContent = url.hostname;
      
      // Set favicon
      if (tabs[0].favIconUrl) {
        siteFavicon.src = tabs[0].favIconUrl;
      } else {
        siteFavicon.src = 'images/globe-icon.png'; // Default icon
      }
      
      // Check if current site is already blocked
      chrome.storage.sync.get(['blockedSites'], function(result) {
        if (result.blockedSites) {
          const isBlocked = result.blockedSites.some(site => url.hostname.includes(site.domain));
          if (isBlocked) {
            blockCurrentSiteButton.textContent = 'Unblock This Site';
            blockCurrentSiteButton.classList.remove('primary-btn');
            blockCurrentSiteButton.classList.add('secondary-btn');
          }
        }
      });
    }
  });
  
  // Load statistics
  chrome.runtime.sendMessage({ action: 'getStats' }, function(response) {
    if (response) {
      sitesBlockedCount.textContent = response.sitesBlocked;
      timeSavedElement.textContent = `${response.timesSaved} hrs`;
    }
  });
  
  // Event listeners
  blockingToggle.addEventListener('change', function() {
    // Check password if disabling blocking
    if (!this.checked) {
      checkPasswordBeforeUnblocking('', (success) => {
        if (success) {
          chrome.storage.sync.set({ isEnabled: false });
          
          // Visual feedback
          const container = document.querySelector('.container');
          container.classList.add('pulse');
          setTimeout(() => container.classList.remove('pulse'), 500);
        } else {
          // Revert toggle if password check failed or was canceled
          this.checked = true;
        }
      });
    } else {
      // No password needed to enable blocking
      chrome.storage.sync.set({ isEnabled: true });
      
      // Visual feedback
      const container = document.querySelector('.container');
      container.classList.add('pulse');
      setTimeout(() => container.classList.remove('pulse'), 500);
    }
  });
  
  focusModeToggle.addEventListener('change', function() {
    // No password needed for focus mode toggle
    chrome.storage.sync.set({ focusModeEnabled: this.checked });
    
    // Visual feedback
    if (this.checked) {
      blockCurrentSiteButton.classList.add('pulse');
      setTimeout(() => blockCurrentSiteButton.classList.remove('pulse'), 500);
    }
  });
  
  blockCurrentSiteButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url) {
        const url = new URL(tabs[0].url);
        const hostname = url.hostname;
        
        chrome.storage.sync.get(['blockedSites'], function(result) {
          let blockedSites = result.blockedSites || [];
          const isBlocked = blockedSites.some(site => hostname.includes(site.domain));
          
          if (isBlocked) {
            // Unblock the site - require password
            checkPasswordBeforeUnblocking(hostname, (success) => {
              if (success) {
                // Password correct or not required, proceed with unblocking
                blockedSites = blockedSites.filter(site => !hostname.includes(site.domain));
                
                chrome.storage.sync.set({ blockedSites: blockedSites }, function() {
                  // Update button appearance
                  blockCurrentSiteButton.textContent = 'Block This Site';
                  blockCurrentSiteButton.classList.add('primary-btn');
                  blockCurrentSiteButton.classList.remove('secondary-btn');
                  
                  // Update stats
                  chrome.runtime.sendMessage({ action: 'getStats' }, function(response) {
                    if (response) {
                      sitesBlockedCount.textContent = response.sitesBlocked;
                      timeSavedElement.textContent = `${response.timesSaved} hrs`;
                    }
                  });
                });
              }
              // If password check failed or was canceled, do nothing
            });
          } else {
            // Block the site - no password needed
            blockedSites.push({
              domain: hostname,
              dateAdded: new Date().toISOString()
            });
            
            chrome.storage.sync.set({ blockedSites: blockedSites }, function() {
              // Update button appearance
              blockCurrentSiteButton.textContent = 'Unblock This Site';
              blockCurrentSiteButton.classList.remove('primary-btn');
              blockCurrentSiteButton.classList.add('secondary-btn');
              
              // Add animation
              blockCurrentSiteButton.classList.add('pulse');
              setTimeout(() => blockCurrentSiteButton.classList.remove('pulse'), 500);
              
              // Update stats
              chrome.runtime.sendMessage({ action: 'getStats' }, function(response) {
                if (response) {
                  sitesBlockedCount.textContent = response.sitesBlocked;
                  timeSavedElement.textContent = `${response.timesSaved} hrs`;
                }
              });
            });
          }
        });
      }
    });
  });
  
  viewBlockedSitesButton.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  openOptionsButton.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  viewInsightsButton.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('insights.html') });
  });
});
