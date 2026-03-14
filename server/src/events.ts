export interface ServerToClientEvents {
  chat_message: (msg: string) => void;
  share_data: (payload: string) => void;
}

export interface ClientToServerEvents {
  chat_message: (msg: string) => void;
  share_data: (payload: string) => void;
}
