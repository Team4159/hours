import UserStore, { UserContext } from '@/stores/UserStore';
import TimeStore, { TimeContext } from '@/stores/TimeStore';

import { ThemeProvider } from '@chakra-ui/core';
import theme from '@/styles/theme';

import '@/styles/base.css';

function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={new UserStore()}>
        <TimeContext.Provider value={new TimeStore()}>
          <Component {...pageProps}/>
        </TimeContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default App;
