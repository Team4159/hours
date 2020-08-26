import { createContext } from 'react';

import { observable } from 'mobx';
import moment from 'moment';

export default class TimeStore {
  @observable currentTime = moment();

  constructor() {
    setInterval(() => {
      this.currentTime = moment();
    }, 1000);
  }
}

export const TimeContext = createContext<TimeStore>(null);
