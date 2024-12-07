# YT Notify

A lightweight Node.js package for receiving real-time YouTube video upload notifications using PubSubHubbub/WebSub protocol.

[![npm version](https://img.shields.io/npm/v/@razor_rsd/ytnotify.svg)](https://www.npmjs.com/package/@razor_rsd/ytnotify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Real-time notifications for new YouTube video uploads
- Support for multiple channel subscriptions
- Event-based notification system
- Express middleware support
- TypeScript support
- Secure webhooks with secret validation

## Installation

```bash
npm install @razor_rsd/ytnotify
```

## Usage

```typescript
import express from 'express';
import { YTNotify } from '@razor_rsd/ytnotify';

const app = express();

const ytNotify = new YTNotify({
  hubCallback: 'https://your-domain.com/youtube-webhook',
  secret: 'your-secret-key',
  path: '/youtube-webhook'
});

// Subscribe to a channel
ytNotify.subscribe('CHANNEL_ID');

// Subscribe to multiple channels
ytNotify.subscribe(['CHANNEL_ID_1', 'CHANNEL_ID_2']);

// Listen for new video notifications
ytNotify.on('notify', (data) => {
  console.log('New video uploaded:', data);
  // data includes: id, channelId, title, link, author, published, updated
});

// Listen for subscription updates
ytNotify.on('subscribe', (data) => {
  console.log('Subscription updated:', data);
});

// Use as middleware
app.use('/youtube-webhook', ytNotify.listener());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| hubCallback | string | Yes | - | Your webhook URL where notifications will be received |
| secret | string | Yes | - | Secret key for webhook validation |
| middleware | boolean | No | false | Enable Express middleware mode |
| path | string | No | "/" | Webhook path for the middleware |
| hubUrl | string | No | "https://pubsubhubbub.appspot.com" | PubSubHubbub hub URL |

## API Reference

### Methods

#### `subscribe(channel: string | string[])`
Subscribe to receive notifications from one or multiple YouTube channels.

#### `unsubscribe(channel: string | string[])`
Unsubscribe from one or multiple YouTube channels.

#### `isSubscribed(channelId: string): Promise<IIsSubscribed>`
Check the subscription status of a channel.

#### `listener()`
Returns an Express middleware function for handling webhook requests.

### Events

#### `notify`
Emitted when a new video is uploaded. Provides video details including:
- id: Video ID
- channelId: Channel ID
- title: Video title
- link: Video URL
- author: Channel name
- published: Publication date
- updated: Last update date

#### `subscribe`
Emitted when a subscription is confirmed.

#### `unsubscribe`
Emitted when an unsubscription is confirmed.

## TypeScript Support

The package includes TypeScript definitions and supports the following interfaces:

```typescript
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
```

## License

MIT

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/RazorRSD/ytnotify/issues).