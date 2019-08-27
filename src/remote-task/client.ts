import {IMicroTaskClient, Unsubscriber} from "../interfaces";
import {IMessenger} from "@viatsyshyn/ts-messenger";
import {Events} from "./consts";

export class RemoteTaskClient<TData=any, TResult=any, TProgress=any>
  implements IMicroTaskClient<TData, TResult, TProgress> {

  constructor(private remote: IMessenger) {}

  cancel(): Promise<void> {
    return this.remote.query(Events.Terminated);
  }

  on(message: "progress", handler: (data?: TProgress) => void): Unsubscriber {
    return this.remote.subscribe(
      new RegExp(`^${Events.Progress}$`),
      (topic: string, data?: TProgress) => handler(data));
  }

  run<T, X = any>(data?: TData): Promise<TResult> {
    return this.remote.query<TResult>(Events.Run, data);
  }
}
