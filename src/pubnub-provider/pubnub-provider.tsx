import React from "react";
import PubNub from "pubnub";

export type PubNubContextProps = {
  pubnub?: PubNub;
  channel: string;
};

const defaultContext = {
  pubnub: undefined,
  channel: "",
} as PubNubContextProps;

export const PubNubContext = React.createContext<PubNubContextProps>(
  defaultContext
);

export interface PubNubProviderProps {
  publishKey: string;
  subscribeKey: string;
  uuid: string;
  channel: string;
}

export const PubNubProvider: React.ComponentType<PubNubProviderProps> = (
  props
) => {
  const { children, publishKey, subscribeKey, channel, uuid } = props;

  const pubnub = new PubNub({
    publishKey,
    subscribeKey,
    uuid,
  });

  return (
    <PubNubContext.Provider value={{ pubnub, channel }}>
      {children}
    </PubNubContext.Provider>
  );
};
