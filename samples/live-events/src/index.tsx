import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import PubNub, { ChannelMetadataObject, ObjectCustom } from "pubnub";
import { PubNubProvider } from "pubnub-react";
import { Chat, usePresence } from "@pubnub/react-chat-components";
import faker from "@faker-js/faker";
import useWindowSize from "react-use/lib/useWindowSize";
import usePrevious from "react-use/lib/usePrevious";

import eventChannels from "../../../data/channels/event.json";
import StreamView from "./components/StreamView";
import ChannelsView from "./components/ChannelsView";
import ChatView from "./components/ChatView";
import "./index.css";

const mdBreakpoint = 768;
const lgBreakpoint = 1024;

const pubnub = new PubNub({
  publishKey: (import.meta.env?.REACT_APP_PUB_KEY as string) || "",
  subscribeKey: (import.meta.env?.REACT_APP_SUB_KEY as string) || "",
  uuid: faker.internet.userName(),
});

const channels: ChannelMetadataObject<ObjectCustom>[] = eventChannels;

const LiveEventChat = (): JSX.Element => {
  const [darkMode, setDarkMode] = useState(true);
  const [currentChannel, setCurrentChannel] = useState(channels[0]);
  const [presence] = usePresence({ channels: channels.map((ch) => ch.id) });
  const { width } = useWindowSize();
  const prevWidth = usePrevious(width) || 0;
  const [channelsExpanded, setChannelsExpanded] = useState(width >= lgBreakpoint);
  const prevChannelsExpanded = usePrevious(channelsExpanded);
  const [chatExpanded, setChatExpanded] = useState(width >= mdBreakpoint);
  const prevChatExpanded = usePrevious(chatExpanded);
  const channelOccupants = presence[currentChannel.id]?.occupants;
  const channelOccupancy = presence[currentChannel.id]?.occupancy;

  /* React to screen size changes to hide side panels */
  useEffect(() => {
    if (width < mdBreakpoint && prevWidth >= mdBreakpoint) setChatExpanded(false);
    if (width >= mdBreakpoint && prevWidth < mdBreakpoint) setChatExpanded(true);
    if (width >= lgBreakpoint && prevWidth < lgBreakpoint) setChannelsExpanded(true);
    if (width < lgBreakpoint && prevWidth >= lgBreakpoint) setChannelsExpanded(false);
  }, [prevWidth, width]);

  /* Allow only one side panel to be open on the "md" breakpoint */
  useEffect(() => {
    if (width < mdBreakpoint || width >= lgBreakpoint) return;
    if (!chatExpanded || !channelsExpanded) return;
    if (!prevChannelsExpanded) setChatExpanded(false);
    if (!prevChatExpanded) setChannelsExpanded(false);
  }, [width, chatExpanded, prevChatExpanded, channelsExpanded, prevChannelsExpanded]);

  return (
    <main className={`flex ${darkMode ? "dark" : "light"}`}>
      <Chat
        currentChannel={currentChannel.id}
        /* Manually pass '-pnpres' channels here to get presence data for channels you don't want to be subscribed to */
        channels={[currentChannel.id, ...channels.map((ch) => `${ch.id}-pnpres`)]}
      >
        <ChannelsView
          {...{
            channels,
            channelsExpanded,
            darkMode,
            presence,
            setChannelsExpanded,
            setCurrentChannel,
            setDarkMode,
          }}
        />
        <StreamView {...{ channelOccupancy, currentChannel }} />
        <ChatView {...{ channelOccupants, chatExpanded, darkMode, setChatExpanded }} />
      </Chat>
    </main>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <PubNubProvider client={pubnub}>
      <LiveEventChat />
    </PubNubProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
