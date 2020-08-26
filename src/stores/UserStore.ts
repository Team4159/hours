import { createContext } from 'react';

import { action, autorun, observable } from 'mobx';
import moment from 'moment';

import User from '@/models/User';

export default class UserStore {
  @observable userData: User = null;
  @observable password: string = null;

  @observable otherUserData = observable([] as User[]);

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

    this.fetchOtherUserData();

    setInterval(this.fetchOtherUserData, 5000);
  }

  @action.bound
  fetchOtherUserData(): Promise<User[]> {
    return fetch('/api/src/endpoints/getdata.php')
      .then(res => res.json())
      .then(json => {
        const otherUsers = json.map(UserStore.hydrateData);
        this.otherUserData.replace(otherUsers);
        return otherUsers;
      });
  }

  @action.bound
  fetchUserData(set: boolean = true): Promise<User> {
    return fetch('/api/src/endpoints/getuserdata.php?' + new URLSearchParams({
      password: this.password
    }))
      .then(res => {
        if (res.status == 404) {
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

  @action
  changePassword(newPassword: string): Promise<User> {
    return fetch('/api/src/endpoints/changepassword.php?' + new URLSearchParams({
      password: this.password,
      newpassword: newPassword
    }))
      .then(async res => {
        if (res.status == 404) {
          throw new Error(await res.text());
        }
        this.password = newPassword;
        return res;
      })
      .then(() => this.fetchUserData());
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
      sessions: json['sessions'] ? json['sessions'].map(jsonSession => ({
        date: moment.unix(parseInt(jsonSession['date'])),
        did: jsonSession['did'],
        time: moment.duration(jsonSession['time'], 'seconds')
      })) : undefined
    };
  }
}

export const UserContext = createContext<UserStore>(null);
