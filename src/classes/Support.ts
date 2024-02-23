import axios from "axios";
import { Request, Response } from "express";
import { IIsSubscribed, IUpdateSubscription } from "../interfaces/IYTNotify";
import xmlbodyparser from "../xmlParser";
import YTNotify from "./YTNotify";
import { createHmac, Hmac } from "crypto";

/**
 * @class Support
 * @description This class is used to support the hub and the subscription process
 * @param {ISupport} supportOptions - The callback URL
 *
 * @property {string} hubCallback - The callback URL
 * @property {string} originHubUrl - The origin URL
 * @property {string} hubUrl - The hub URL
 * @property {string} secret - The secret
 *
 * @method _makeRequest - Make a request to the hub
 * @method _checkSubscription - Check if a channel is subscribed
 * @method _verifyRequest - Verify the request
 * @method _processRequest - Process the request
 * @method _getRequestProcess - Process the GET request
 * @method _postRequestProcess - Process the POST request
 *
 */

interface ISupport {
  hubCallback: string;
  originHubUrl: string;
  hubUrl: string;
  secret: string;
}

class Support {
  private hubCallback: string;
  private originHubUrl: string;
  private hubUrl: string;
  private secret: string;

  constructor(supportOptions: ISupport) {
    this.hubCallback = supportOptions.hubCallback;
    this.originHubUrl = supportOptions.originHubUrl;
    this.hubUrl = supportOptions.hubUrl;
    this.secret = supportOptions.secret;
  }

  _makeRequest(channelIdL: string, type: string) {
    const topic = this.originHubUrl + channelIdL;
    const data = {
      "hub.callback": this.hubCallback,
      "hub.mode": type,
      "hub.topic": topic,
      "hub.secret": this.secret,
    };
    axios.post(this.hubUrl, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  async _checkSubscription(channelId: string): Promise<IIsSubscribed> {
    const topic = this.originHubUrl + channelId;
    const hubUrl = this.hubUrl + "/subscription-details?";
    const params = new URLSearchParams({
      "hub.callback": this.hubCallback,
      "hub.secret": this.secret,
      "hub.topic": topic,
    });

    const x = await axios.get(hubUrl + params, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });

    const rowData: { [key: string]: string } = {};
    const regex = /<dt>(.*?)<\/dt>\s*<dd>(.*?)<\/dd>/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(x.data)) !== null) {
      const term = match[1].trim();
      const description = match[2].trim();

      if (term && description) {
        rowData[term] = description;
      }
    }

    const data = {
      callBackURL: rowData["Callback URL"],
      state: rowData["State"],
      lastSuccessfullVerification: rowData["Last successful verification"],
      expirationTime: rowData["Expiration time"],
      lastSubscribeRequest: rowData["Last subscribe request"],
      lastUnsubscribeRequest: rowData["Last unsubscribe request"],
      contentReceived: rowData["Content received"],
      contentDelivered: rowData["Content delivered"],
    };

    return data;
  }

  async _verifyRequest(req: Request, res: Response, YTNotify: YTNotify) {
    const { body, headers } = req;
    const data = await xmlbodyparser(req, res);
    const secretHeader = headers["x-hub-signature"] as string;
    if (this.secret && !secretHeader) {
      return res.sendStatus(403);
    }
    const signatureParts = secretHeader.split("=");
    const algorithm = signatureParts[0].toLowerCase();
    const signature = signatureParts[1].toLowerCase();

    try {
      const hmac = createHmac(algorithm, this.secret);
      hmac.update(data.data);
      const digest = hmac.digest("hex").toLowerCase();

      if (signature !== digest) {
        return res.sendStatus(403);
      }

      return this._postRequestProcess(data.result, res, YTNotify);
    } catch (err) {
      return res.sendStatus(403);
    }
  }

  _processRequest(req: Request, res: Response, YTNotify: YTNotify) {
    if (req.method === "GET") {
      return this._getRequestProcess(req, res, YTNotify);
    } else if (req.method === "POST") {
      return this._verifyRequest(req, res, YTNotify);
    }
  }

  _getRequestProcess(req: Request, res: Response, YTNotify: YTNotify) {
    const query = req.query;
    const hubChallenge = query["hub.challenge"];
    const hubMode = query["hub.mode"];
    const hubTopic = query["hub.topic"] as string;
    const hubLease = query["hub.lease_seconds"];
    const channelId = hubTopic.replace(this.originHubUrl, "");
    const data: IUpdateSubscription = {
      type: hubMode as any,
      channel: channelId,
      expirationTime: hubLease as string,
    };
    if (hubMode === "subscribe") {
      YTNotify.emit("subscribe", data);
    } else if (hubMode === "unsubscribe") {
      YTNotify.emit("unsubscribe", data);
    }
    return res.status(200).set("Content-Type", "text/plain").end(hubChallenge);
  }

  async _postRequestProcess(data: any, res: Response, YTNotify: YTNotify) {
    if (data.feed["at:deleted-entry"]) return res.sendStatus(200);
    const entry = data?.feed?.entry[0];
    if (!entry) {
      YTNotify.emit("error", "No entry found");
      return res.status(400).end();
    }
    const doc = {
      id: entry["yt:videoId"][0],
      channelId: entry["yt:channelId"][0],
      title: entry.title[0],
      link: entry.link[0].$.href,
      author: entry.author[0].name[0],
      published: entry.published[0],
      updated: entry.updated[0],
    };

    YTNotify.emit("notify", doc);
    return res.status(200).end();
  }
}

export default Support;
