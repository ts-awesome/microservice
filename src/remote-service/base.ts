import {IMicroServiceServer, Unsubscriber} from "../interfaces";
import {IMessenger} from "@viatsyshyn/ts-messenger";

const enum State {
  Initialized = 0,
  Stated = 1,
  Terminating = 2,
  Terminated = 3,
}

export abstract class RemoteServiceBase implements IMicroServiceServer {
  private _state = State.Initialized;
  private _handling = 0;

  public get terminated(): boolean {
    return this._state >= State.Terminated;
  }

  protected constructor(private remote: IMessenger) {}

  public async start(): Promise<void> {
    this.remote.serve(/.*/, this._handler);

    this._state = State.Stated;

    this._handling++;
    await this.onStart();
    this._handling--;

    while (this._state <= State.Terminating) {
      await sleep( 100);
    }
  }

  public async stop(): Promise<void> {
    if (this._state === State.Stated) {
      this._state = State.Terminating;

      while (this._handling) {
        await sleep( 50);
      }

      await sleep( 1);

      try {
        await this.onTerminate();
      } finally {
        this._state = State.Terminated;
      }
    }
  }

  private _handler = async (topic: string, data?: any) => {
    if (this._state !== State.Stated) {
      return ;
    }

    this._handling++;
    try {
      return await this.handle(topic, data);
    } finally {
      this._handling--;
    }
  };

  protected abstract onStart(): Promise<void>;

  protected async onTerminate(): Promise<void> {}

  protected async handle<T>(topic: string, data?: any): Promise<T> {
    if (!this[topic] || !Reflect.get(this, topic)) {
      throw Error(`NotFound: ${topic}`)
    }

    return await this[topic].call(this, data);
  }

  protected on<T=any>(event: RegExp, handler: (event: string, data?: T) => void): Unsubscriber {
    return this.remote.subscribe(event, handler);
  }
}

function sleep(timeout: number = 1): Promise<void> {
  return new Promise(r => setTimeout(r, timeout));
}
