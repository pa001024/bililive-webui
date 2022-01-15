export interface IMessage {
  id: string;
  uid: number;
  uname: string;
  text: string;
  t: number;
}

export interface IQueueRequest {
  id: string;
  uid: number;
  uname: string;
  type: string;
  t: number;
}
