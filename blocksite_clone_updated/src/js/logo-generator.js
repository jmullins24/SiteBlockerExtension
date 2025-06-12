// Create a simple logo for the extension
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');

// Draw red circle background
ctx.fillStyle = '#e74c3c';
ctx.beginPath();
ctx.arc(64, 64, 60, 0, 2 * Math.PI);
ctx.fill();

// Draw darker inner circle
ctx.fillStyle = '#c0392b';
ctx.beginPath();
ctx.arc(64, 64, 50, 0, 2 * Math.PI);
ctx.fill();

// Draw white rounded rectangle
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.roundRect(32, 32, 64, 64, 8);
ctx.fill();

// Draw three red bars (representing a block list)
ctx.fillStyle = '#e74c3c';
for (let i = 0; i < 3; i++) {
  ctx.beginPath();
  ctx.roundRect(44, 44 + i * 16, 40, 8, 4);
  ctx.fill();
}

// Convert to PNG data URL
const logoDataUrl = canvas.toDataURL('image/png');

// Create logo image elements
const logo16 = document.createElement('img');
logo16.src = logoDataUrl;
logo16.width = 16;
logo16.height = 16;

const logo48 = document.createElement('img');
logo48.src = logoDataUrl;
logo48.width = 48;
logo48.height = 48;

const logo128 = document.createElement('img');
logo128.src = logoDataUrl;
logo128.width = 128;
logo128.height = 128;

// Function to download the images
function downloadLogo(size) {
  const a = document.createElement('a');
  a.href = logoDataUrl;
  a.download = `icon${size}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Download all sizes
downloadLogo(16);
downloadLogo(48);
downloadLogo(128);
