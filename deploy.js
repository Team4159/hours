const ghpages = require('gh-pages');

ghpages.publish('out', {
  history: false,
  dotfiles: true
}, console.error);
