import { Request, Response } from "express";
import xml2js from "xml2js";
const regexp = /^(text\/xml|application\/([\w!#$%&*`\-.^~]+\+)?xml)$/i;

function hasBody({ headers }: { headers: any }) {
  const encoding = "transfer-encoding" in headers;
  const length =
    "content-length" in headers && headers["content-length"] !== "0";
  return encoding || length;
}

function mime({ headers }: { headers: any }) {
  const str = headers["content-type"] || "";
  return str.split(";")[0];
}

async function xmlbodyparser(req: Request, res: Response) {
  let data = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    data += chunk;
  });
  const xml: any = await new Promise((resolve, reject) => {
    req.on("end", () => {
      if (data) {
        resolve(data);
      } else {
        reject("No data received");
      }
    });
  });

  const parser = new xml2js.Parser();
  const result = await new Promise((resolve, reject) => {
    parser.parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
  return { result, data };
}

export default xmlbodyparser;
