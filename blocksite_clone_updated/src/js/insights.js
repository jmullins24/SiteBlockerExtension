// Insights page script for BlockSite Clone extension

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const totalSitesBlocked = document.getElementById('total-sites-blocked');
  const totalTimeSaved = document.getElementById('total-time-saved');
  const focusScore = document.getElementById('focus-score');
  const topSitesChart = document.getElementById('top-sites-chart');
  const activityByDayChart = document.getElementById('activity-by-day-chart');
  const detailedStatsTable = document.getElementById('detailed-stats-table').querySelector('tbody');
  
  // Load insights data
  loadInsights();
  
  function loadInsights() {
    chrome.runtime.sendMessage({ action: 'getStats' }, function(response) {
      if (response) {
        // Update overview stats
        totalSitesBlocked.textContent = response.sitesBlocked;
        totalTimeSaved.textContent = response.timesSaved;
        
        // Calculate focus score (mock calculation for demo)
        const score = Math.min(100, Math.round((response.sitesBlocked / 10) * (response.timesSaved / 30) * 100));
        focusScore.textContent = score;
        
        // Render top sites chart
        renderTopSitesChart(response.topSites || []);
        
        // Render activity by day chart (mock data for demo)
        renderActivityByDayChart();
        
        // Populate detailed stats table
        populateDetailedStatsTable(response.topSites || []);
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
      return `
        <div class="chart-item">
          <div class="chart-label">
            <span>${site.domain}</span>
            <span>${site.count} blocks</span>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('');
    
    topSitesChart.innerHTML = chartHtml;
  }
  
  function renderActivityByDayChart() {
    // Mock data for demo
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mockData = [
      { day: 'Sunday', blocks: 15 },
      { day: 'Monday', blocks: 42 },
      { day: 'Tuesday', blocks: 38 },
      { day: 'Wednesday', blocks: 29 },
      { day: 'Thursday', blocks: 35 },
      { day: 'Friday', blocks: 22 },
      { day: 'Saturday', blocks: 8 }
    ];
    
    // Find max blocks for scaling
    const maxBlocks = Math.max(...mockData.map(d => d.blocks));
    
    // Create chart HTML
    const chartHtml = mockData.map(data => {
      const percentage = (data.blocks / maxBlocks) * 100;
      return `
        <div class="chart-item">
          <div class="chart-label">
            <span>${data.day}</span>
            <span>${data.blocks} blocks</span>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('');
    
    activityByDayChart.innerHTML = chartHtml;
  }
  
  function populateDetailedStatsTable(topSites) {
    if (topSites.length === 0) {
      detailedStatsTable.innerHTML = '<tr><td colspan="4">No data available yet.</td></tr>';
      return;
    }
    
    // Clear table
    detailedStatsTable.innerHTML = '';
    
    // Add rows for each site
    topSites.forEach(site => {
      const row = document.createElement('tr');
      
      // Calculate estimated time saved (5-15 minutes per block, random for demo)
      const minutesPerBlock = Math.floor(Math.random() * 10) + 5;
      const timeSaved = (site.count * minutesPerBlock / 60).toFixed(1);
      
      // Mock last blocked date (random recent date for demo)
      const daysAgo = Math.floor(Math.random() * 7);
      const lastBlocked = new Date();
      lastBlocked.setDate(lastBlocked.getDate() - daysAgo);
      const formattedDate = lastBlocked.toLocaleDateString();
      
      row.innerHTML = `
        <td>${site.domain}</td>
        <td>${site.count}</td>
        <td>${timeSaved} hours</td>
        <td>${formattedDate}</td>
      `;
      
      detailedStatsTable.appendChild(row);
    });
  }
});
