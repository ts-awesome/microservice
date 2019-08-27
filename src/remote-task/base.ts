import {IMicroTaskServer, Unsubscriber} from "../interfaces";
import {IMessenger} from "@viatsyshyn/ts-messenger";
import {Events} from "./consts";

const enum State {
  Initial = 0,
  Ready = 1,
  Running = 2,
  Terminating = 3,
  Terminated = 4,
}

export abstract class RemoteTaskBase<TData = any, TResult = any, TProgress = any> implements IMicroTaskServer {
  private state: State = State.Initial;
  private handlers = new Set<Function>();

  protected constructor(private remote: IMessenger) {}

  public on(kind: 'end', handler: () => void): Unsubscriber {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public async start(): Promise<void> {
    this.remote.serve(new RegExp(`^${Events.Run}$`), this.handleRun);
    this.remote.serve(new RegExp(`^${Events.Terminated}$`), this.handleTerminate);

    this.state = State.Ready;
    this.remote.publish(Events.Ready);
  }

  private handleRun = async (topic: string, data?: TData) => {
    this.state = State.Running;
    try {
      return await this.main(data)
    } catch (e) {
      throw e;
    } finally {
      await this.handleTerminate();
    }
  };

  private handleTerminate = async () => {
    if (this.state < State.Terminating) {
      this.state = State.Terminating;
      await this.onTerminate();
      this.state = State.Terminated;
      this.remote.publish(Events.Terminated);

      this.handlers.forEach(cb => cb());
    }
  };

  protected abstract main(data?: TData): TResult;
  protected async onTerminate(): Promise<void> {}

  protected progress(data?: TProgress) {
    this.remote.publish(Events.Progress, data);
  }

  protected get terminating() {
    return this.state >= State.Terminating;
  }

  public get terminated() {
    return this.state >= State.Terminated;
  }
}
