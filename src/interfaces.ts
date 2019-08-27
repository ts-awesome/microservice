export interface Unsubscriber {
  (): void;
}

export interface IMicroServiceServer {
  readonly terminated: boolean;

  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface IMicroServiceClient {
  call<T=any>(routine: string, args: any[]): Promise<T>;
  notify<T=any>(event: string, data?: T): void;
  on<T=any>(event: string, handler: (data?: T) => void): Unsubscriber;
}

export interface IMicroTaskServer {
  readonly terminated: boolean;

  start(): Promise<void>;
  on(kind: 'end', handler: () => void): Unsubscriber;
}

export interface IMicroTaskClient<TData=any, TResult=any, TProgress=any> {
  run(data: TData): Promise<TResult>;
  cancel(): Promise<void>;

  on(message: 'progress', handler: (data?: TProgress) => void): Unsubscriber;
}
