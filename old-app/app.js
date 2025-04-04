const Store = require('electron-store');

try {
  console.log('Creating store...');
  const store = new Store();
  console.log('Store created successfully!');
  console.log('Store path:', store.path);
} catch (error) {
  console.error('Error creating store:', error);
} 