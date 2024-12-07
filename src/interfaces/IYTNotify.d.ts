declare type IModuleOptions = {
  hubCallback: string;
  secret: string;
  middleware?: boolean;
  path?: string;
  hubUrl?: string;
};

declare type INotifyData = {
  id: string;
  channelId: string;
  title: string;
  link: string;
  author: string;
  published: string;
  updated: string;
};

declare type IUpdateSubscription = {
  type: "subscribe" | "unsubscribe";
  channel: string | string[];
  expirationTime?: string;
};

declare type IIsSubscribed = {
  callBackURL: string;
  state: string;
  lastSuccessfullVerification: string;
  expirationTime: string;
  lastSubscribeRequest: string;
  lastUnsubscribeRequest: string;
  contentReceived: string;
  contentDelivered: string;
};
