import React, { FC } from "react";
import { useRecoilValue } from "recoil";
import {
  CurrentChannelTypingIndicatorAtom,
  ThemeAtom,
  TypingIndicatorTimeoutAtom,
  UsersMetaAtom,
} from "../state-atoms";
import "./typing-indicator.scss";

export interface TypingIndicatorProps {
  /** Put a TypingIndicator with this option enabled inside of a MessageList component to render indicators as Messages. */
  showAsMessage?: boolean;
}

export const TypingIndicator: FC<TypingIndicatorProps> = (props: TypingIndicatorProps) => {
  const theme = useRecoilValue(ThemeAtom);
  const users = useRecoilValue(UsersMetaAtom);
  const typingIndicators = useRecoilValue(CurrentChannelTypingIndicatorAtom);
  const typingIndicatorTimeout = useRecoilValue(TypingIndicatorTimeoutAtom);

  const activeUUIDs = Object.keys(typingIndicators).filter((id) => {
    return Date.now() - parseInt(typingIndicators[id]) / 10000 < typingIndicatorTimeout * 1000;
  });

  const getIndicationString = () => {
    let indicateStr = "";
    if (activeUUIDs.length > 1) indicateStr = "Multiple users are typing...";
    if (activeUUIDs.length == 1) {
      const user = users.find((u) => u.id === activeUUIDs[0]);
      indicateStr = `${user?.name || "Unknown User"} is typing...`;
    }
    return indicateStr;
  };

  const renderUserBubble = (uuid) => {
    const user = users.find((u) => u.id === uuid);

    return (
      <div className="pn-msg" key={uuid}>
        <div className="pn-msg__avatar">
          {user?.profileUrl && <img src={user.profileUrl} alt="User avatar" />}
          {!user?.profileUrl && <div className="pn-msg__avatar-placeholder" />}
        </div>

        <div className="pn-msg__main">
          <div className="pn-msg__title">
            <span className="pn-msg__author">{user?.name || "Unknown User"}</span>
          </div>
          <div className="pn-msg__bubble">
            <span className="pn-typing-indicator-dot">●</span>
            <span className="pn-typing-indicator-dot">●</span>
            <span className="pn-typing-indicator-dot">●</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {!props.showAsMessage && (
        <div className={`pn-typing-indicator pn-typing-indicator--${theme}`}>
          {getIndicationString()}&nbsp;
        </div>
      )}

      {props.showAsMessage && activeUUIDs.map((uuid) => renderUserBubble(uuid))}
    </>
  );
};

TypingIndicator.defaultProps = {
  showAsMessage: false,
};
