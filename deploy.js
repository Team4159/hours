const ghpages = require('gh-pages');

ghpages.publish('out', {
  history: false,
  dotfiles: true,
  user: {
    name: 'bot',
    email: 'bot@example.com'
  },
}, console.error);
