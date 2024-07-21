export namespace buildEvents {
    let fileChanged: BuildEventType<{
        absolute: string;
        relative: string;
    }>;
    let websocketMessage: BuildEventType<string>;
}
export type BuildEventType<T> = {
    subscribe: (listener: BuildEventListener<T>) => Unsubscribe;
    publish: (event: T) => void;
};
export type BuildEventListener<T> = (event: BuildEvent<T>) => Promise<void>;
export type Unsubscribe = () => void;
export type BuildEvent<T> = {
    stopPropagation: () => void;
    isPropagationStopped: boolean;
    data: T;
};
