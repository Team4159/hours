export default interface User {
  name: string;
  password: string;
  signedIn: boolean;
  lastSignedIn: moment.Moment;
  totalTime: moment.Duration;
}
