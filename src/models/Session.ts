export default interface Session {
  date: moment.Moment;
  did: string;
  time: moment.Duration;
  flagged: boolean;
}
