import React from "react";
import { EmojiPickerElementProps } from "chat-components-common";

export const Picker = (props: EmojiPickerElementProps): JSX.Element => {
  const handleEmoji = (event) => {
    if (props.onEmojiSelect) props.onEmojiSelect({ native: event.target.textContent });
  };

  return (
    <>
      <span>Emoji Picker</span>
      <button onClick={handleEmoji}>🙂</button>
      <button onClick={handleEmoji}>😄</button>
    </>
  );
};
