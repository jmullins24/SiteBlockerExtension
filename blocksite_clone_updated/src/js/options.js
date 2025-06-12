// Enhanced options page script for BlockSite Clone extension

document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation
  const tabLinks = document.querySelectorAll('.nav-menu li');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabLinks.forEach(link => {
    link.addEventListener('click', function() {
      // Remove active class from all tabs
      tabLinks.forEach(l => l.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Block List Tab
  const newSiteInput = document.getElementById('new-site-input');
  const addSiteBtn = document.getElementById('add-site-btn');
  const blockedSitesContainer = document.getElementById('blocked-sites-container');
  
  // Load blocked sites
  loadBlockedSites();
  
  // Add site to block list
  addSiteBtn.addEventListener('click', function() {
    const siteUrl = newSiteInput.value.trim();
    if (siteUrl) {
      addSiteToBlockList(siteUrl);
      newSiteInput.value = '';
    }
  });
  
  newSiteInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addSiteBtn.click();
    }
  });
  
  function addSiteToBlockList(siteUrl) {
    // Format URL (remove http://, https://, www.)
    let domain = siteUrl.toLowerCase();
    if (domain.startsWith('http://')) domain = domain.substring(7);
    if (domain.startsWith('https://')) domain = domain.substring(8);
    if (domain.startsWith('www.')) domain = domain.substring(4);
    
    // Remove trailing slashes
    domain = domain.replace(/\/+$/, '');
    
    if (!domain) return;
    
    chrome.storage.sync.get(['blockedSites'], function(result) {
      let blockedSites = result.blockedSites || [];
      
      // Check if site is already blocked
      if (blockedSites.some(site => site.domain === domain)) {
        alert('This site is already in your block list.');
        return;
      }
      
      // Add site to block list
      blockedSites.push({
        domain: domain,
        dateAdded: new Date().toISOString()
      });
      
      chrome.storage.sync.set({ blockedSites: blockedSites }, function() {
        loadBlockedSites();
        
        // Add animation to the new item
        setTimeout(() => {
          const newItem = document.querySelector('.blocked-site-item:first-child');
          if (newItem) {
            newItem.style.animation = 'fadeIn 0.5s ease-in-out';
          }
        }, 100);
      });
    });
  }
  
  function loadBlockedSites() {
    chrome.storage.sync.get(['blockedSites'], function(result) {
      const blockedSites = result.blockedSites || [];
      
      // Clear container
      blockedSitesContainer.innerHTML = '';
      
      if (blockedSites.length === 0) {
        blockedSitesContainer.innerHTML = '<div class="blocked-site-item">No sites in your block list yet.</div>';
        return;
      }
      
      // Sort sites by date added (newest first)
      blockedSites.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      // Add sites to container
      blockedSites.forEach(site => {
        const siteElement = document.createElement('div');
        siteElement.className = 'blocked-site-item';
        
        const dateAdded = new Date(site.dateAdded);
        const formattedDate = dateAdded.toLocaleDateString();
        
        // Create favicon URL
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${site.domain}`;
        
        siteElement.innerHTML = `
          <div class="site-info">
            <img src="${faviconUrl}" class="site-favicon" alt="">
            <span>${site.domain}</span>
          </div>
          <span>${formattedDate}</span>
          <span><button class="remove-site-btn" data-domain="${site.domain}">Remove</button></span>
        `;
        
        blockedSitesContainer.appendChild(siteElement);
      });
      
      // Add event listeners to remove buttons
      document.querySelectorAll('.remove-site-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const domain = this.getAttribute('data-domain');
          removeSiteFromBlockList(domain);
        });
      });
    });
  }
  
  function removeSiteFromBlockList(domain) {
    // Check password before removing site
    checkPasswordBeforeUnblocking(domain, (success) => {
      if (!success) {
        return; // Password check failed or was canceled
      }
      
      chrome.storage.sync.get(['blockedSites'], function(result) {
        let blockedSites = result.blockedSites || [];
        
        // Find the element to animate before removal
        const itemToRemove = document.querySelector(`.remove-site-btn[data-domain="${domain}"]`).closest('.blocked-site-item');
        
        // Add fade out animation
        if (itemToRemove) {
          itemToRemove.style.animation = 'fadeOut 0.3s ease-in-out';
          itemToRemove.style.opacity = '0';
        }
        
        // Remove site from block list after animation
        setTimeout(() => {
          blockedSites = blockedSites.filter(site => site.domain !== domain);
          
          chrome.storage.sync.set({ blockedSites: blockedSites }, function() {
            loadBlockedSites();
          });
        }, 300);
      });
    });
  }
  
  // Schedule Tab
  const scheduleStartTime = document.getElementById('schedule-start-time');
  const scheduleEndTime = document.getElementById('schedule-end-time');
  const dayCheckboxes = document.querySelectorAll('.days-selector input[type="checkbox"]');
  const addScheduleBtn = document.getElementById('add-schedule-btn');
  const schedulesContainer = document.getElementById('schedules-container');
  const sitesSelectionContainer = document.getElementById('sites-selection-container');
  const scheduleSitesList = document.getElementById('schedule-sites-list');
  const sitesScopeRadios = document.querySelectorAll('input[name="sites-scope"]');
  
  // Load schedules
  loadSchedules();
  
  // Load blocked sites for schedule selection
  loadBlockedSitesForSchedule();
  
  // Toggle sites selection visibility based on radio button selection
  sitesScopeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'selected') {
        sitesSelectionContainer.classList.remove('hidden');
      } else {
        sitesSelectionContainer.classList.add('hidden');
      }
    });
  });
  
  // Add schedule
  addScheduleBtn.addEventListener('click', function() {
    const startTime = scheduleStartTime.value;
    const endTime = scheduleEndTime.value;
    
    if (!startTime || !endTime) {
      alert('Please select both start and end times.');
      return;
    }
    
    // Get selected days
    const selectedDays = {};
    dayCheckboxes.forEach(checkbox => {
      const day = parseInt(checkbox.getAttribute('data-day'));
      selectedDays[day] = checkbox.checked;
    });
    
    // Check if at least one day is selected
    if (!Object.values(selectedDays).some(Boolean)) {
      alert('Please select at least one day.');
      return;
    }
    
    // Get sites scope
    const sitesScope = document.querySelector('input[name="sites-scope"]:checked').value;
    
    // Get selected sites if scope is 'selected'
    let selectedSites = [];
    if (sitesScope === 'selected') {
      const siteCheckboxes = document.querySelectorAll('#schedule-sites-list input[type="checkbox"]');
      siteCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          selectedSites.push(checkbox.value);
        }
      });
      
      // Check if at least one site is selected
      if (selectedSites.length === 0) {
        alert('Please select at least one site for this schedule.');
        return;
      }
    }
    
    addSchedule(startTime, endTime, selectedDays, sitesScope, selectedSites);
  });
  
  function loadBlockedSitesForSchedule() {
    chrome.storage.sync.get(['blockedSites'], function(result) {
      const blockedSites = result.blockedSites || [];
      
      // Clear container
      scheduleSitesList.innerHTML = '';
      
      if (blockedSites.length === 0) {
        scheduleSitesList.innerHTML = '<p>No sites in your block list yet.</p>';
        return;
      }
      
      // Add sites to container as checkboxes
      blockedSites.forEach(site => {
        const siteElement = document.createElement('div');
        siteElement.className = 'site-checkbox-item';
        
        // Create favicon URL
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${site.domain}`;
        
        siteElement.innerHTML = `
          <input type="checkbox" value="${site.domain}" id="site-${site.domain.replace(/\./g, '-')}">
          <img src="${faviconUrl}" class="site-favicon" alt="">
          <label for="site-${site.domain.replace(/\./g, '-')}">${site.domain}</label>
        `;
        
        scheduleSitesList.appendChild(siteElement);
      });
    });
  }
  
  function addSchedule(startTime, endTime, days, sitesScope, selectedSites) {
    chrome.storage.sync.get(['schedules'], function(result) {
      let schedules = result.schedules || [];
      
      // Add schedule
      schedules.push({
        startTime: startTime,
        endTime: endTime,
        days: days,
        sitesScope: sitesScope,
        selectedSites: selectedSites
      });
      
      chrome.storage.sync.set({ schedules: schedules }, function() {
        loadSchedules();
        
        // Reset form
        scheduleStartTime.value = '';
        scheduleEndTime.value = '';
        dayCheckboxes.forEach(checkbox => {
          checkbox.checked = false;
        });
        document.querySelector('input[name="sites-scope"][value="all"]').checked = true;
        sitesSelectionContainer.classList.add('hidden');
        const siteCheckboxes = document.querySelectorAll('#schedule-sites-list input[type="checkbox"]');
        siteCheckboxes.forEach(checkbox => {
          checkbox.checked = false;
        });
        
        // Add animation to the add button
        addScheduleBtn.classList.add('pulse');
        setTimeout(() => addScheduleBtn.classList.remove('pulse'), 500);
      });
    });
  }
  
  function loadSchedules() {
    chrome.storage.sync.get(['schedules', 'blockedSites'], function(result) {
      const schedules = result.schedules || [];
      const blockedSites = result.blockedSites || [];
      
      // Clear container
      schedulesContainer.innerHTML = '';
      
      if (schedules.length === 0) {
        schedulesContainer.innerHTML = '<div class="schedule-item">No schedules set up yet.</div>';
        return;
      }
      
      // Add schedules to container
      schedules.forEach((schedule, index) => {
        const scheduleElement = document.createElement('div');
        scheduleElement.className = 'schedule-item';
        
        // Format days
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = Object.entries(schedule.days)
          .filter(([_, isSelected]) => isSelected)
          .map(([day, _]) => dayNames[day]);
        
        // Format sites scope
        let sitesInfo = 'All blocked sites';
        if (schedule.sitesScope === 'selected' && schedule.selectedSites && schedule.selectedSites.length > 0) {
          const siteCount = schedule.selectedSites.length;
          const sitesList = schedule.selectedSites.slice(0, 3).join(', ');
          sitesInfo = `${siteCount} selected site${siteCount > 1 ? 's' : ''}`;
          
          // Add tooltip with full list
          if (siteCount > 3) {
            sitesInfo += ` (${sitesList}, ...)`;
          } else {
            sitesInfo += ` (${sitesList})`;
          }
        }
        
        scheduleElement.innerHTML = `
          <div class="schedule-time">${schedule.startTime} - ${schedule.endTime}</div>
          <div class="schedule-days">${selectedDays.join(', ')}</div>
          <div class="schedule-sites">Applies to: ${sitesInfo}</div>
          <button class="remove-schedule-btn" data-index="${index}">Remove Schedule</button>
        `;
        
        schedulesContainer.appendChild(scheduleElement);
      });
      
      // Add event listeners to remove buttons
      document.querySelectorAll('.remove-schedule-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          removeSchedule(index);
        });
      });
      
      // Refresh the sites selection list in case blocked sites have changed
      loadBlockedSitesForSchedule();
    });
  }
  
  function removeSchedule(index) {
    chrome.storage.sync.get(['schedules'], function(result) {
      let schedules = result.schedules || [];
      
      // Find the element to animate before removal
      const itemToRemove = document.querySelector(`.remove-schedule-btn[data-index="${index}"]`).closest('.schedule-item');
      
      // Add fade out animation
      if (itemToRemove) {
        itemToRemove.style.animation = 'fadeOut 0.3s ease-in-out';
        itemToRemove.style.opacity = '0';
      }
      
      // Remove schedule after animation
      setTimeout(() => {
        schedules.splice(index, 1);
        
        chrome.storage.sync.set({ schedules: schedules }, function() {
          loadSchedules();
        });
      }, 300);
    });
  }
  
  // Insights Tab
  const totalSitesBlocked = document.getElementById('total-sites-blocked');
  const totalTimeSaved = document.getElementById('total-time-saved');
  const topSitesChart = document.getElementById('top-sites-chart');
  
  // Load insights
  loadInsights();
  
  function loadInsights() {
    chrome.runtime.sendMessage({ action: 'getStats' }, function(response) {
      if (response) {
        totalSitesBlocked.textContent = response.sitesBlocked;
        totalTimeSaved.textContent = response.timesSaved;
        
        // Render top sites chart
        renderTopSitesChart(response.topSites || []);
      }
    });
  }
  
  function renderTopSitesChart(topSites) {
    if (topSites.length === 0) {
      topSitesChart.innerHTML = '<p>No data available yet.</p>';
      return;
    }
    
    // Sort sites by count (highest first)
    topSites.sort((a, b) => b.count - a.count);
    
    // Calculate total blocks for percentage
    const totalBlocks = topSites.reduce((sum, site) => sum + site.count, 0);
    
    // Create chart HTML
    const chartHtml = topSites.map(site => {
      const percentage = (site.count / totalBlocks) * 100;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${site.domain}`;
      
      return `
        <div class="chart-item">
          <div class="chart-label">
            <span><img src="${faviconUrl}" class="site-favicon" alt=""> ${site.domain}</span>
            <span>${site.count} blocks</span>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar" style="width: 0%"></div>
          </div>
        </div>
      `;
    }).join('');
    
    topSitesChart.innerHTML = chartHtml;
    
    // Animate chart bars after a short delay
    setTimeout(() => {
      const chartBars = topSitesChart.querySelectorAll('.chart-bar');
      topSites.forEach((site, index) => {
        const percentage = (site.count / totalBlocks) * 100;
        chartBars[index].style.width = `${percentage}%`;
      });
    }, 100);
  }
  
  // Settings Tab
  const enableBlockingToggle = document.getElementById('enable-blocking-toggle');
  const focusModeToggle = document.getElementById('focus-mode-toggle');
  const redirectUrlInput = document.getElementById('redirect-url-input');
  const saveRedirectBtn = document.getElementById('save-redirect-btn');
  const passwordProtectionToggle = document.getElementById('password-protection-toggle');
  const passwordFields = document.getElementById('password-fields');
  const passwordInput = document.getElementById('password-input');
  const confirmPasswordInput = document.getElementById('confirm-password-input');
  const savePasswordBtn = document.getElementById('save-password-btn');
  
  // Load settings
  loadSettings();
  
  // Event listeners
  enableBlockingToggle.addEventListener('change', function() {
    chrome.storage.sync.set({ isEnabled: this.checked });
  });
  
  focusModeToggle.addEventListener('change', function() {
    chrome.storage.sync.set({ focusModeEnabled: this.checked });
  });
  
  saveRedirectBtn.addEventListener('click', function() {
    const redirectUrl = redirectUrlInput.value.trim();
    chrome.storage.sync.set({ redirectUrl: redirectUrl }, function() {
      // Show success message
      const originalText = saveRedirectBtn.textContent;
      saveRedirectBtn.textContent = 'Saved!';
      saveRedirectBtn.disabled = true;
      
      setTimeout(() => {
        saveRedirectBtn.textContent = originalText;
        saveRedirectBtn.disabled = false;
      }, 1500);
    });
  });
  
  passwordProtectionToggle.addEventListener('change', function() {
    if (this.checked) {
      passwordFields.classList.remove('hidden');
      passwordFields.style.animation = 'fadeIn 0.3s ease-in-out';
    } else {
      passwordFields.style.animation = 'fadeOut 0.3s ease-in-out';
      setTimeout(() => {
        passwordFields.classList.add('hidden');
      }, 300);
      
      // If turning off password protection, clear password
      chrome.storage.sync.get(['passwordProtection'], function(result) {
        const passwordProtection = result.passwordProtection || {};
        passwordProtection.enabled = false;
        
        chrome.storage.sync.set({ passwordProtection: passwordProtection });
      });
    }
  });
  
  savePasswordBtn.addEventListener('click', function() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!password) {
      alert('Please enter a password.');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    
    chrome.storage.sync.set({
      passwordProtection: {
        enabled: true,
        password: password
      }
    }, function() {
      // Show success message
      const originalText = savePasswordBtn.textContent;
      savePasswordBtn.textContent = 'Password Saved!';
      savePasswordBtn.disabled = true;
      
      setTimeout(() => {
        savePasswordBtn.textContent = originalText;
        savePasswordBtn.disabled = false;
        passwordInput.value = '';
        confirmPasswordInput.value = '';
      }, 1500);
    });
  });
  
  function loadSettings() {
    chrome.storage.sync.get(['isEnabled', 'focusModeEnabled', 'redirectUrl', 'passwordProtection'], function(result) {
      enableBlockingToggle.checked = result.isEnabled !== false;
      focusModeToggle.checked = result.focusModeEnabled === true;
      
      if (result.redirectUrl) {
        redirectUrlInput.value = result.redirectUrl;
      }
      
      if (result.passwordProtection && result.passwordProtection.enabled) {
        passwordProtectionToggle.checked = true;
        passwordFields.classList.remove('hidden');
      } else {
        passwordProtectionToggle.checked = false;
        passwordFields.classList.add('hidden');
      }
    });
  }
  
  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(10px); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .pulse {
      animation: pulse 0.5s ease-in-out;
    }
  `;
  document.head.appendChild(style);
});
