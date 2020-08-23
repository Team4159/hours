import Session from "./Session";

export default interface User {
  name: string;
  password: string;
  signedIn: boolean;
  lastTime: moment.Moment;
  totalTime: moment.Duration;
  sessions: Session[];
}
