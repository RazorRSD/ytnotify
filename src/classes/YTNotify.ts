import EventEmitter from "events";
import { Request, Response } from "express";
import {
  IIsSubscribed,
  IModuleOptions,
  INotifyData,
  IUpdateSubscription,
} from "../interfaces/IYTNotify";
import Support from "./Support";

const originHubUrl = "https://www.youtube.com/xml/feeds/videos.xml?channel_id=";

class YTNotify extends EventEmitter {
  public hubCallback: string;
  public hubUrl: string;
  public secret?: string;
  public middleware: boolean;
  public path: string;
  private support: Support;

  constructor(options: IModuleOptions) {
    super();

    if (!options.hubCallback) {
      throw new Error("Missing hubCallback");
    }

    this.hubCallback = options.hubCallback;
    this.hubUrl = options.hubUrl || "https://pubsubhubbub.appspot.com";
    this.secret = options.secret;
    this.middleware = options.middleware || false;
    this.path = options.path || "/";
    this.support = new Support({
      hubCallback: this.hubCallback,
      originHubUrl,
      hubUrl: this.hubUrl,
      secret: this.secret,
    });
  }

  /**
   * Subscribe - Subscribe to a channel in order to receive notifications
   * @param channel - Channel ID or an array of channel IDs
   * @example
   * subscribe("UC-lHJZR3Gqxm24_Vd_AJ5Yw");
   * subscribe(["UC-lHJZR3Gqxm24_Vd_AJ5Yw", "UC-lHJZR3Gqxm24_Vd_AJ5Yw"]);
   */
  subscribe(channel: string | string[]): void {
    if (Array.isArray(channel)) {
      for (const channelId of channel) {
        this.support._makeRequest(channelId, "subscribe");
      }
    } else {
      this.support._makeRequest(channel, "subscribe");
    }
  }

  /**
   * Unsubscribe - Unsubscribe from a channel in order to stop receiving notifications
   * @param channel - Channel ID or an array of channel IDs
   * @example
   * unsubscribe("UC-lHJZR3Gqxm24_Vd_AJ5Yw");
   * unsubscribe(["UC-lHJZR3Gqxm24_Vd_AJ5Yw", "UC-lHJZR3Gqxm24_Vd_AJ5Yw"]);
   */
  unsubscribe(channel: string | string[]): void {
    if (Array.isArray(channel)) {
      for (const channelId of channel) {
        this.support._makeRequest(channelId, "unsubscribe");
      }
    } else {
      this.support._makeRequest(channel, "unsubscribe");
    }
  }

  /**
   * isSubscribed - Check if the channel is subscribed
   * @param channelId - Channel ID
   * @returns {Promise<IIsSubscribed>} - Promise with the subscription data
   * @example
   * const data = await isSubscribed("UC-lHJZR3Gqxm24_Vd_AJ5Yw");
   * console.log(data);
   * // {
   * //   callBackURL: "https://example.com",
   * //   state: "subscribed",
   * //   lastSuccessfullVerification: "2021-08-01T00:00:00Z",
   * //   expirationTime: "2021-08-01T00:00:00Z",
   * //   lastSubscribeRequest: "2021-08-01T00:00:00Z",
   * //   lastUnsubscribeRequest: "2021-08-01T00:00:00Z",
   * //   contentReceived: "2021-08-01T00:00:00Z",
   * //   contentDelivered: "2021-08-01T00:00:00Z",
   * // }
   */
  async isSubscribed(channelId: string): Promise<IIsSubscribed> {
    const data = await this.support._checkSubscription(channelId);
    return data;
  }

  /**
   * listener - Listener for the middleware
   * @returns {(req: Request, res: Response) => void} - Express middleware
   * @example
   * app.use("/yt-notify", listener());
   */
  listener() {
    return (req: Request, res: Response) =>
      this.support._processRequest(req, res, this);
  }

  on(event: "notify", listener: (data: INotifyData) => unknown): this;
  on(
    event: "subscribe",
    listener: (data: IUpdateSubscription) => unknown
  ): this;
  on(
    event: "unsubscribe",
    listener: (data: IUpdateSubscription) => unknown
  ): this;

  on(
    eventName: "subscribe" | "unsubscribe" | "notify",
    listener: (...args: any[]) => void
  ): this {
    return super.on(eventName, listener);
  }
}

export default YTNotify;
