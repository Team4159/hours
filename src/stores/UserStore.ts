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
        this.fetchUserData()
          .catch(console.error);
      }
    }

    autorun(() => {
      if (this.password == null) {
        localStorage.removeItem('password');
      } else {
        localStorage.setItem('password', this.password);
      }
    });
  }

  @action.bound
  fetchUserData(set: boolean = true): Promise<User> {
    return fetch('/api/src/endpoints/getuserdata.php?' + new URLSearchParams({
      password: this.password
    }))
      .then(res => {
        if (res.status == 500) {
          throw new Error('Unable to find any matching accounts.');
        }
        return res;
      })
      .then(res => res.json())
      .then(json => {
        const user = UserStore.hydrateData(json);
        if (set) {
          this.userData = user;
        }
        return user;
      });
  }

  signIn(): Promise<User> {
    return fetch('/api/src/endpoints/signin.php?' + new URLSearchParams({
      password: this.password
    }))
      .then(() => this.fetchUserData());
  }

  signOut(did: string): Promise<User> {
    return fetch('/api/src/endpoints/signout.php?' + new URLSearchParams({
      password: this.password,
      did
    }))
      .then(() => this.fetchUserData());
  }

  forgetPassword() {
    this.password = null;
    this.userData = null;
  }

  static hydrateData(json: { [key: string]: any }): User {
    return {
      name: json['username'],
      password: json['password'],
      signedIn: json['signedIn'],
      lastTime: moment.unix(json['lastTime']),
      totalTime: moment.duration(json['totalTime'], 'seconds'),
      sessions: json['sessions'].map(jsonSession => ({
        date: moment.unix(parseInt(jsonSession['date'])),
        did: jsonSession['did'],
        time: moment.duration(jsonSession['time'], 'seconds')
      }))
    };
  }
}

export const UserContext = createContext<UserStore>(null);
