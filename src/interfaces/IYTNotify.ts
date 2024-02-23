interface IModuleOptions {
  hubCallback: string;
  secret: string;
  middleware?: boolean;
  path?: string;
  hubUrl?: string;
}

interface INotifyData {
  id: string;
  channelId: string;
  title: string;
  link: string;
  author: string;
  published: string;
  updated: string;
}

interface IUpdateSubscription {
  type: "subscribe" | "unsubscribe";
  channel: string | string[];
  expirationTime?: string;
}

interface IIsSubscribed {
  callBackURL: string;
  state: string;
  lastSuccessfullVerification: string;
  expirationTime: string;
  lastSubscribeRequest: string;
  lastUnsubscribeRequest: string;
  contentReceived: string;
  contentDelivered: string;
}

export { IModuleOptions, INotifyData, IUpdateSubscription, IIsSubscribed };
