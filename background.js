const MESSARI_API_BASE_URL = 'https://data.messari.io/api/v1/assets';
const UPDATE_INTERVAL = 5; // minutes
const SIGNIFICANT_CHANGE_THRESHOLD = 0.05; // 5% change
const DEFAULT_ASSETS = ['BTC', 'ETH']; // Changed to only 2 default assets

function fetchAssets(assets) {
  const assetString = assets.join(',');
  const url = `${MESSARI_API_BASE_URL}?fields=id,name,symbol,metrics/market_data/price_usd&assets=${assetString}`;

  return fetch(url)
    .then(response => response.json())
    .then(data => {
      return data.data.map(asset => ({
        name: asset.name,
        symbol: asset.symbol,
        price: asset.metrics.market_data.price_usd
      }));
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      return [];
    });
}

function fetchHistoricalData(asset, days = 7) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const url = `${MESSARI_API_BASE_URL}/${asset}/metrics/price/time-series?start=${startDate}&end=${endDate}&interval=1d`;

  return fetch(url)
    .then(response => response.json())
    .then(data => {
      return data.data.values.map(value => ({
        date: new Date(value[0]).toLocaleDateString(),
        price: value[4]
      }));
    })
    .catch(error => {
      console.error('Error fetching historical data:', error);
      return [];
    });
}

function checkForSignificantChanges(newAssets, oldAssets) {
  const changes = [];
  newAssets.forEach(newAsset => {
    const oldAsset = oldAssets.find(asset => asset.symbol === newAsset.symbol);
    if (oldAsset) {
      const priceChange = (newAsset.price - oldAsset.price) / oldAsset.price;
      if (Math.abs(priceChange) >= SIGNIFICANT_CHANGE_THRESHOLD) {
        changes.push({
          symbol: newAsset.symbol,
          name: newAsset.name,
          priceChange: priceChange
        });
      }
    }
  });
  return changes;
}

function sendNotifications(changes) {
  changes.forEach(change => {
    const changePercent = (change.priceChange * 100).toFixed(2);
    const direction = change.priceChange > 0 ? 'increased' : 'decreased';
    const message = `${change.name} (${change.symbol}) has ${direction} by ${Math.abs(changePercent)}%`;
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.svg',
      title: 'Significant Price Change',
      message: message
    });
  });
}

function updateAssets() {
  chrome.storage.sync.get(['userAssets'], (result) => {
    const userAssets = result.userAssets || DEFAULT_ASSETS;
    fetchAssets(userAssets.slice(0, 2)).then(newAssets => { // Only fetch top 2 assets
      chrome.storage.local.get(['topAssets'], (result) => {
        const oldAssets = result.topAssets || [];
        const significantChanges = checkForSignificantChanges(newAssets, oldAssets);
        
        if (significantChanges.length > 0) {
          sendNotifications(significantChanges);
        }

        chrome.storage.local.set({
          topAssets: newAssets,
          lastUpdated: new Date().toISOString()
        });
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  updateAssets();
  chrome.alarms.create('updateAssets', { periodInMinutes: UPDATE_INTERVAL });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateAssets') {
    updateAssets();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchAssets') {
    fetchAssets(request.assets.slice(0, 2)).then(assets => { // Only fetch top 2 assets
      sendResponse({data: assets});
    });
    return true; // Indicates that the response will be sent asynchronously
  } else if (request.action === 'fetchHistoricalData') {
    fetchHistoricalData(request.asset, request.days).then(data => {
      sendResponse({data: data});
    });
    return true; // Indicates that the response will be sent asynchronously
  }
});
