# Crypto Assets Tracker Chrome Extension

This Chrome extension displays price values and history charts of the top 2 crypto assets from Messari.io. Users can customize their list of tracked assets and receive desktop notifications for significant price changes.

## Features

- Track the top 2 crypto assets
- View current prices and 7-day price history charts
- Add and remove assets from your tracking list (limited to 2)
- Receive desktop notifications for significant price changes (5% or more)

## Installation

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory containing the extension files.
5. The Crypto Assets Tracker extension should now appear in your Chrome toolbar.

## Usage

1. Click on the extension icon in the Chrome toolbar to open the popup.
2. The popup will display your current list of tracked assets (maximum 2) with their latest prices.
3. To add a new asset:
   - Enter the asset symbol (e.g., BTC, ETH) in the input field at the bottom of the popup.
   - Click the "Add Asset" button or press Enter.
   - Note: Adding a new asset will replace the oldest asset in your list if you already have 2 assets.
4. To remove an asset:
   - Click the "X" button next to the asset you want to remove.
   - A default asset will be added if removing an asset would leave you with less than 2 tracked assets.
5. To view the 7-day price history chart for an asset:
   - Click on the asset's name or price in the list.
   - The chart will appear below the asset list.

## Desktop Notifications

The extension will check for significant price changes (5% or more) every 5 minutes. When a significant change is detected, you will receive a desktop notification.

To test the desktop notifications:
1. Add or remove some assets to trigger updates.
2. Wait for a few minutes or manually trigger price changes (for testing purposes, you can temporarily modify the `SIGNIFICANT_CHANGE_THRESHOLD` in `background.js` to a smaller value, e.g., 0.01 for 1% change).
3. You should receive desktop notifications for significant price changes.

## Customization

You can modify the following variables in `background.js` to customize the extension's behavior:

- `UPDATE_INTERVAL`: Change the frequency of price updates (in minutes).
- `SIGNIFICANT_CHANGE_THRESHOLD`: Adjust the threshold for triggering price change notifications (default is 0.05 for 5%).

## Troubleshooting

If you encounter any issues:

1. Make sure you have an active internet connection.
2. Check that you've allowed the extension to send notifications in Chrome settings.
3. Try reloading the extension from the `chrome://extensions/` page.
4. If problems persist, try uninstalling and reinstalling the extension.

## Privacy

This extension only accesses data from the Messari.io API and does not collect or store any personal information.

## Disclaimer

This extension is for informational purposes only and should not be considered financial advice. Always do your own research before making investment decisions.
