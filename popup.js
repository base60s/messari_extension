document.addEventListener('DOMContentLoaded', () => {
  const assetList = document.getElementById('asset-list');
  const lastUpdated = document.getElementById('last-updated');
  const newAssetInput = document.getElementById('new-asset');
  const addAssetBtn = document.getElementById('add-asset-btn');
  const chartContainer = document.getElementById('chart-container');
  const ctx = document.getElementById('price-chart').getContext('2d');
  let chart;

  function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  function updatePopup(data) {
    assetList.innerHTML = '';
    data.forEach(asset => {
      const assetElement = document.createElement('div');
      assetElement.className = 'asset';
      assetElement.innerHTML = `
        <span class="asset-name">${asset.name} (${asset.symbol})</span>
        <span class="asset-price">${formatPrice(asset.price)}</span>
        <button class="remove-asset" data-symbol="${asset.symbol}">X</button>
      `;
      assetElement.addEventListener('click', () => fetchAndDisplayChart(asset.symbol));
      assetList.appendChild(assetElement);
    });

    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-asset').forEach(button => {
      button.addEventListener('click', removeAsset);
    });
  }

  function fetchAndDisplayChart(symbol) {
    chrome.runtime.sendMessage({action: 'fetchHistoricalData', asset: symbol, days: 7}, (response) => {
      if (response && response.data) {
        displayChart(symbol, response.data);
      }
    });
  }

  function displayChart(symbol, data) {
    const labels = data.map(item => item.date);
    const prices = data.map(item => item.price);

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${symbol} Price (USD)`,
          data: prices,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }

  function fetchDataAndUpdate() {
    chrome.storage.sync.get(['userAssets'], (result) => {
      const userAssets = result.userAssets || ['BTC', 'ETH'];
      chrome.runtime.sendMessage({action: 'fetchAssets', assets: userAssets.slice(0, 2)}, (response) => {
        if (response && response.data) {
          updatePopup(response.data);
        }
      });
    });
  }

  function addAsset() {
    const newAsset = newAssetInput.value.trim().toUpperCase();
    if (newAsset) {
      chrome.storage.sync.get(['userAssets'], (result) => {
        let userAssets = result.userAssets || ['BTC', 'ETH'];
        if (!userAssets.includes(newAsset)) {
          userAssets.unshift(newAsset); // Add new asset to the beginning of the array
          userAssets = userAssets.slice(0, 2); // Keep only the top 2 assets
          chrome.storage.sync.set({userAssets: userAssets}, () => {
            newAssetInput.value = '';
            fetchDataAndUpdate();
          });
        } else {
          alert('Asset already in the list');
        }
      });
    }
  }

  function removeAsset(event) {
    event.stopPropagation();
    const assetToRemove = event.target.dataset.symbol;
    const assetName = event.target.parentElement.querySelector('.asset-name').textContent;
    
    if (confirm(`Are you sure you want to remove ${assetName} from your tracking list?`)) {
      chrome.storage.sync.get(['userAssets'], (result) => {
        let userAssets = result.userAssets || ['BTC', 'ETH'];
        userAssets = userAssets.filter(asset => asset !== assetToRemove);
        if (userAssets.length < 2) {
          // If less than 2 assets remain, add a default asset
          const defaultAssets = ['BTC', 'ETH'];
          for (let asset of defaultAssets) {
            if (!userAssets.includes(asset)) {
              userAssets.push(asset);
              if (userAssets.length === 2) break;
            }
          }
        }
        chrome.storage.sync.set({userAssets: userAssets}, () => {
          fetchDataAndUpdate();
        });
      });
    }
  }

  addAssetBtn.addEventListener('click', addAsset);
  newAssetInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      addAsset();
    }
  });

  fetchDataAndUpdate();

  // Update data every 30 seconds when popup is open
  setInterval(fetchDataAndUpdate, 30000);
});
