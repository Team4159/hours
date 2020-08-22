import UserStore, { UserContext } from '@/stores/UserStore';

import { ThemeProvider } from '@chakra-ui/core';
import theme from '@/styles/theme';

import '@/styles/base.css';

function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={new UserStore()}>
        <Component {...pageProps}/>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default App;
