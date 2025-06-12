// This file implements the core blocking functionality for the BlockSite Clone extension

// Store for tracking blocked sites statistics
let blockStats = {
  totalBlocked: 0,
  siteStats: {}
};

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log('BlockSite Clone extension installed or updated');
  
  // Initialize default settings if not already set
  const settings = await chrome.storage.sync.get([
    'blockedSites', 
    'isEnabled', 
    'redirectUrl', 
    'schedules', 
    'focusModeEnabled', 
    'passwordProtection',
    'blockStats'
  ]);
  
  // Set default values if not already set
  if (!settings.blockedSites) {
    await chrome.storage.sync.set({ blockedSites: [] });
  }
  
  if (settings.isEnabled === undefined) {
    await chrome.storage.sync.set({ isEnabled: true });
  }
  
  if (!settings.redirectUrl) {
    await chrome.storage.sync.set({ redirectUrl: '' });
  }
  
  if (!settings.schedules) {
    await chrome.storage.sync.set({ schedules: [] });
  }
  
  if (settings.focusModeEnabled === undefined) {
    await chrome.storage.sync.set({ focusModeEnabled: false });
  }
  
  if (!settings.passwordProtection) {
    await chrome.storage.sync.set({ 
      passwordProtection: {
        enabled: false,
        password: ''
      }
    });
  }
  
  if (!settings.blockStats) {
    await chrome.storage.sync.set({ blockStats: blockStats });
  } else {
    blockStats = settings.blockStats;
  }
  
  // Set up alarm for checking schedules
  chrome.alarms.create('scheduleCheck', { periodInMinutes: 1 });
});

// Listen for web navigation events to check if URL should be blocked
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Only process main frame navigation (not iframes, etc)
  if (details.frameId !== 0) return;
  
  checkIfShouldBlock(details.url, details.tabId);
});

// Function to check if a URL should be blocked
async function checkIfShouldBlock(url, tabId) {
  try {
    const settings = await chrome.storage.sync.get([
      'blockedSites', 
      'isEnabled', 
      'redirectUrl', 
      'schedules', 
      'focusModeEnabled'
    ]);
    
    // If blocking is disabled, don't block anything
    if (!settings.isEnabled) return;
    
    // Get hostname from URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check if current time matches any schedule for this domain
    const shouldBlockBySchedule = checkSchedules(settings.schedules, hostname);

    // Determine if blocking should occur
    // If no schedules are defined, blocking should be active at all times
    const hasSchedules = Array.isArray(settings.schedules) && settings.schedules.length > 0;
    const shouldBlock = settings.focusModeEnabled || !hasSchedules || shouldBlockBySchedule;
    
    if (!shouldBlock) return;
    
    // Check if URL is in the blocked list
    
    const isBlocked = settings.blockedSites.some(site => {
      return hostname.includes(site.domain);
    });
    
    if (isBlocked) {
      // Update statistics
      updateBlockStats(hostname);
      
      // If redirect URL is set, redirect to it, otherwise show block page
      if (settings.redirectUrl) {
        chrome.tabs.update(tabId, { url: settings.redirectUrl });
      } else {
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
      }
    }
  } catch (error) {
    console.error('Error in checkIfShouldBlock:', error);
  }
}

// Function to check if current time matches any schedule for a specific domain
function checkSchedules(schedules, domain = null) {
  if (!schedules || schedules.length === 0) return false;
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes for easier comparison
  
  return schedules.some(schedule => {
    // Check if today is in the schedule
    if (!schedule.days[dayOfWeek]) return false;
    
    // Parse start and end times
    const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
    
    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;
    
    // Check if current time is within schedule
    const isTimeWithinSchedule = currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
    
    if (!isTimeWithinSchedule) return false;
    
    // If domain is provided, check if this schedule applies to this domain
    if (domain && schedule.sitesScope === 'selected') {
      // Check if domain is in the selected sites for this schedule
      return schedule.selectedSites && schedule.selectedSites.some(site => domain.includes(site));
    }
    
    // If no domain provided or schedule applies to all sites, return true
    return true;
  });
}

// Function to update block statistics
async function updateBlockStats(hostname) {
  try {
    // Increment total blocks
    blockStats.totalBlocked++;
    
    // Update site-specific stats
    if (!blockStats.siteStats[hostname]) {
      blockStats.siteStats[hostname] = {
        count: 0,
        lastBlocked: null
      };
    }
    
    blockStats.siteStats[hostname].count++;
    blockStats.siteStats[hostname].lastBlocked = new Date().toISOString();
    
    // Save updated stats
    await chrome.storage.sync.set({ blockStats: blockStats });
  } catch (error) {
    console.error('Error updating block stats:', error);
  }
}

// Set up alarm for periodic checks (for schedule changes)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'scheduleCheck') {
    try {
      // Check all open tabs against current schedules
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.url) {
          checkIfShouldBlock(tab.url, tab.id);
        }
      });
    } catch (error) {
      console.error('Error in alarm handler:', error);
    }
  }
});

// Listen for messages from popup or options page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkPassword') {
    chrome.storage.sync.get(['passwordProtection'], (result) => {
      if (result.passwordProtection && 
          result.passwordProtection.enabled && 
          result.passwordProtection.password === request.password) {
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    });
    return true; // Required for async sendResponse
  }
  
  if (request.action === 'getStats') {
    chrome.storage.sync.get(['blockStats'], (result) => {
      if (result.blockStats) {
        // Convert site stats object to array for easier processing
        const topSites = Object.entries(result.blockStats.siteStats || {})
          .map(([domain, stats]) => ({
            domain,
            count: stats.count,
            lastBlocked: stats.lastBlocked
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Get top 10 sites
        
        sendResponse({
          sitesBlocked: result.blockStats.totalBlocked || 0,
          timesSaved: Math.round((result.blockStats.totalBlocked || 0) * 7.5 / 60), // Estimate 7.5 minutes saved per block
          topSites: topSites
        });
      } else {
        sendResponse({
          sitesBlocked: 0,
          timesSaved: 0,
          topSites: []
        });
      }
    });
    return true; // Required for async sendResponse
  }
});
