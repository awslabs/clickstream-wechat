# AWS Solution Clickstream Analytics SDK for WeChat

## Introduction

Clickstream WeChat Mini Program SDK is part of [Clickstream Analytics on AWS](https://github.com/awslabs/clickstream-analytics-on-aws), it helps WeChat Mini Program (WMP) owner collect user events on WMP easily. The SDK leverages WeChat Mini Program framework and APIs. We designed well architected events recording and publish mechanism to ensure the efficiency and reliability of the SDK. With events being recorded, AWS Clickstream solution can generate statistics and analysis of specific scenario data. We provide numerous preset commonly used event statistics for Clickstream solution users.

## Usage Guidance

### Import the SDK

Download SDK bundled *.js* file and add it to the WeChat Mini Program project.

### Initialize the SDK
The SDK should be initialized with necessary configurations before it can work with Clickstream Analytics solution. Take TypeScript mini program project for example, add following code snippet in the *app.ts* file **BEFORE** default `App()` method and fill in `appId` and `endpoint` values, which can be got from the control plane after registering the app to a Clickstream Analytics data pipeline.

```typescript
import { ClickstreamAnalytics } from './clickstream-wechat';

ClickstreamAnalytics.init({
    appId: 'your appId',
    endpoint: 'https://example.com/collect'
});
```

In addition to the required configuration `appId` and `endpoint`, there are optional configuration properties used for customizing the SDK.

| Property Name           | Required | Default Value | Description                                                  |
| ----------------------- | :------: |---------------| ------------------------------------------------------------ |
| appId                   |   yes    | -             | appId of the project in Clickstream Analytics control plane  |
| endpoint                |   yes    | -             | the ingestion server endpoint                                |
| sendMode                |    no    | *Immediate*   | options: *Immediate*, *Batch*                                |
| sendEventsInterval      |    no    | 5000          | interval (in milliseconds) of sending events, only works for batch send mode |
| autoTrackAppShow        |    no    | true          | whether auto record app view event                           |
| autoTrackAppEnd         |    no    | true          | whether auto record app hide event                           |
| autoTrackPageShow       |    no    | true          | whether auto record page view event                          |
| autoTrackUserEngagement |    no    | true          | whether auto record user engagement                          |
| autoTrackMPShare        |    no    | false         | whether auto record when user shares mini program            |
| autoTrackMPFavorite     |    no    | false         | whether auto record when user adds mini program to favorites |
| debug                   |    no    | false         | whether print out logs in the console                        |
| authCookie              |    no    | -             | auth cookie for AWS application load balancer auth           |
| sessionTimeoutDuration  |    no    | 1800000       | session timeout duration in millisecond                      |

The SDK configurations can be updated after initialization by calling `configure()` method

```typescript
ClickstreamAnalytics.configure({
    appId: 'your appId',
    endpoint: 'https://example.com/collect',
    sendMode: 'Batch',
    debug: true,
    authCookie: 'auth cookie',
    autoTrackPageShow: false
});
```

### Use the SDK

#### Add User Info

```typescript
// add or update user attributes
ClickstreamAnalytics.setUserAttributes({
  userName:"carl",
  userAge: 22
});

// when user login
ClickstreamAnalytics.setUserId("UserId");

// when user logout
ClickstreamAnalytics.setUserId(null);
```

Current login user's attributes will be cached in wxStorage.

#### Record Event

SDK user can call `ClickstreamAnalytics.record()` method to record custom event. The property `name` is required, while the property `attributes` and `items` are optional. `attributes` property is an object, `items` property is an array list of `item` type object.

`item` type definition:

| Property Name | Type             | Required |
| ------------- | ---------------- | :------: |
| brand         | string           |    no    |
| category      | string           |    no    |
| category2     | string           |    no    |
| category3     | string           |    no    |
| category4     | string           |    no    |
| category5     | string           |    no    |
| creative_name | string           |    no    |
| creative_slot | string           |    no    |
| id            | string           |    no    |
| location_id   | string           |    no    |
| name          | string           |    no    |
| price         | string \| number |    no    |
| quantity      | number           |    no    |

Custom event record samples:

```typescript
ClickstreamAnalytics.record({ name: 'albumVisit' });
ClickstreamAnalytics.record({
  name: 'buttonClick',
  attributes: { buttonName: 'confirm', itemNo: 12345, inStock: true },
  items: [
    {
      id: 'p_123',
      name: 'item_name',
      price: 168.99
    }
  ]
});
```

## How to integrate and test locally

**Integrate**

Clone this repository to local, execute the following script to generate `clickstream-wechat.js`, `clickstream-wechat.min.js` and corresponding `.map` files, which will be located in the project *dist* folder.
```bash
cd clickstream-web && npm run release
```

Copy the `clickstream-wechat.js` or `clickstream-wechat.min.js` with corresponding `.map` files into WeChat mini program project, then use it by
```typescript
import { ClickstreamAnalytics } from './clickstream-wechat';
```
or
```typescript
import { ClickstreamAnalytics } from './clickstream-wechat.min.js';
```

**Test**

```bash
npm run test
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the [Apache 2.0 License](./LICENSE).
