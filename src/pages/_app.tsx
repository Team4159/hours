import { ThemeProvider } from '@chakra-ui/core';
import theme from '@/styles/theme';

import '@/styles/base.css';

function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default App;
