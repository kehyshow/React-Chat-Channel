import React from "react";
import { ChatComponents } from "../src";
import PubNub from "pubnub";
import { PubNubMock } from "./pubnub-mock";

const pubnub = new PubNubMock();

// const pubnub = new PubNub({
//   publishKey: "pub-c-2e4f37a4-6634-4df6-908d-32eb38d89a1b",
//   subscribeKey: "sub-c-1456a186-fd7e-11ea-ae2d-56dc81df9fb5",
//   uuid: "user_0202a46151cc43af890caa521c40576e",
// });

export const decorators = [
  (Story, context) => (
    <ChatComponents
      {...{
        pubnub,
        channel: "space_ac4e67b98b34b44c4a39466e93e",
        theme: context.parameters.theme || "dark",
      }}
    >
      <Story />
    </ChatComponents>
  ),
];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  options: {
    storySort: {
      order: [
        "Introduction",
        "Components",
        ["Chat Components (Provider)"],
        "Examples"
      ]
    },
  },
};
