import {IMessenger} from "@viatsyshyn/ts-messenger";
import {IMicroServiceClient, Unsubscriber} from "../interfaces";

export class RemoteServiceClient implements IMicroServiceClient {

  constructor(private remote: IMessenger) {}

  public call<T>(routine: string, data: any): Promise<T> {
    return this.remote.query(routine, data);
  }

  public notify(event: string, data: any): void {
    this.remote.publish(event, data);
  }

  on<T = any>(event: string, handler: (data?: T) => void): Unsubscriber {
    return this.remote.subscribe(new RegExp(event), (topic: string, data?: T) => handler(data));
  }
}
