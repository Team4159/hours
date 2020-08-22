import { createContext } from 'react';

import { action, autorun, observable } from 'mobx';
import moment from 'moment';

import User from '@/models/User';

export default class UserStore {
  @observable userData: User = null;
  @observable password: string = null;

  constructor() {
    if (typeof localStorage != 'undefined') {
      const storedPassword = localStorage.getItem('password');
      if (storedPassword) {
        this.password = storedPassword;
        this.fetchUserData(this.password)
          .catch(console.error);
      }
    }

    autorun(() => {
      if (this.password != null) {
        localStorage.setItem('password', this.password);
      }
    });
  }

  @action.bound
  fetchUserData(password: string): Promise<User> {
    return fetch('/api/src/endpoints/getuserdata.php?' + new URLSearchParams({
      password
    }))
      .then(res => res.json())
      .then(json => {
        if (json == null) {
          throw new Error('Unable to find any matching accounts');
        } else {
          const user = UserStore.arrayToUser(json);
          this.userData = user;
          return user;
        }
      });
  }

  signInOut(): Promise<string> {
    return fetch('/api/src/endpoints/signin.php?' + new URLSearchParams({
      password: this.password
    }))
      .then(res => res.text())
      .then(text => {
        this.fetchUserData(this.password);
        return text;
      });
  }

  static arrayToUser(array: Array<string>): User {
    return {
      name: array[0],
      password: array[1],
      signedIn: array[2] == 'TRUE',
      lastSignedIn: moment.unix(parseInt(array[3])),
      totalTime: moment.duration(array[4], 'seconds')
    };
  }
}

export const UserContext = createContext<UserStore>(null);
