import React from "react";
import { FetchMessagesResponse, MessageEvent } from "pubnub";
import { PubNubContext } from "../pubnub-provider";
import SpinnerIcon from "./spinner.svg";
import "./message-list.scss";

export interface MessageListProps {
  /* Select one of predefined themes */
  theme?: "light" | "dark" | "event" | "event-dark" | "support" | "support-dark";
  /* Disable fetching of the users data */
  disableUserFetch?: boolean;
  /* Provide user data for message display */
  users: MessageListUser[];
  /* Disable fetching of messages stored in the history */
  disableHistoryFetch?: boolean;
  /* Provide custom message renderer if themes and CSS variables aren't enough */
  messageRenderer?: (props: MessageRendererProps) => JSX.Element;
  /* A callback run on new messages */
  onMessage?: (message: MessageListMessage) => unknown;
  /* A callback run on list scroll */
  onScroll?: (event: React.UIEvent<HTMLElement>) => unknown;
}

export interface MessageRendererProps {
  isOwnMessage: boolean;
  message: MessageListMessage;
  time: string;
  user?: MessageListUser;
}

interface MessageListState {
  messages: MessageListMessage[];
  messagesPerPage: number;
  pagination?: string | number;
  paginationEnd: boolean;
  scrolledBottom: boolean;
  unreadMessages: number;
  users: MessageListUser[];
}

export interface MessageListUser {
  id: string;
  name?: string | null;
  profileUrl?: string | null;
}

export interface MessageListMessage {
  channel: string;
  message: {
    text: string;
    [key: string]: unknown;
  };
  timetoken: string | number;
  publisher?: string;
  uuid?: string;
  meta?: {
    [key: string]: unknown;
  };
  actions?: {
    [type: string]: {
      [value: string]: Array<{
        uuid: string;
        actionTimetoken: string | number;
      }>;
    };
  };
}

export class MessageList extends React.Component<MessageListProps, MessageListState> {
  private spinnerRef: React.RefObject<HTMLDivElement>;
  private listRef: React.RefObject<HTMLDivElement>;
  private endRef: React.RefObject<HTMLDivElement>;
  private spinnerObserver: IntersectionObserver;
  private bottomObserver: IntersectionObserver;

  static contextType = PubNubContext;
  // This is needed to have context correctly typed
  // https://github.com/facebook/create-react-app/issues/8918
  context!: React.ContextType<typeof PubNubContext>;

  static defaultProps = {
    theme: "light",
    users: [],
  };

  constructor(props: MessageListProps) {
    super(props);
    this.state = {
      messages: [],
      messagesPerPage: 100,
      pagination: undefined,
      paginationEnd: false,
      scrolledBottom: true,
      unreadMessages: 0,
      users: [],
    };
    this.endRef = React.createRef();
    this.listRef = React.createRef();
    this.spinnerRef = React.createRef();
    this.bottomObserver = new IntersectionObserver((e) =>
      this.handleBottomScroll(e[0].isIntersecting)
    );
    this.spinnerObserver = new IntersectionObserver(
      (e) => e[0].isIntersecting === true && this.fetchMoreHistory()
    );
  }

  /*
  /* Helper functions
  */

  private getTime(timestamp: number) {
    const ts = String(timestamp);
    const date = new Date(parseInt(ts) / 10000);
    const minutes = date.getMinutes();
    return `${date.getHours()}:${minutes > 9 ? minutes : "0" + minutes}`;
  }

  private scrollToBottom() {
    if (!this.endRef.current) return;
    this.endRef.current.scrollIntoView();
  }

  private setupSpinnerObserver() {
    if (!this.spinnerRef.current) return;
    this.spinnerObserver.observe(this.spinnerRef.current);
  }

  private setupBottomObserver() {
    if (!this.endRef.current) return;
    this.bottomObserver.disconnect();
    this.bottomObserver.observe(this.endRef.current);
  }

  private getUser(uuid: string) {
    return (
      this.props.users.find((u) => u.id === uuid) || this.state.users.find((u) => u.id === uuid)
    );
  }

  private isOwnMessage(uuid: string) {
    return this.context.pubnub?.getUUID() === uuid;
  }

  /*
  /* Commands
  */

  private async fetchMessageSenders(messages: MessageListMessage[]) {
    if (this.props.disableUserFetch) return;

    try {
      const uniqueUuids = new Set(messages.map((m) => m.uuid || m.publisher));
      const uniqueUuidsArr = Array.from(uniqueUuids);

      for (const uuid of uniqueUuidsArr) {
        if (!uuid || this.getUser(uuid)) return;
        const user = await this.context.pubnub.objects.getUUIDMetadata({ uuid });
        if (!user?.data) return;
        this.setState({ users: [...this.state.users, user.data] });
      }
    } catch (e) {
      console.error(e);
    }
  }

  private async fetchMoreHistory() {
    try {
      const firstMessage = this.listRef.current?.querySelector("div");
      const response = await this.context.pubnub.fetchMessages({
        channels: [this.context.channel],
        count: this.state.messagesPerPage,
        start: this.state.pagination,
      });
      this.handleHistoryFetch(response);
      if (firstMessage) firstMessage.scrollIntoView();
    } catch (e) {
      console.error(e);
    }
  }

  /*
  /* Event handlers
  */

  private handleBottomScroll(scrolledBottom: boolean) {
    if (scrolledBottom) this.setState({ unreadMessages: 0 });
    this.setState({ scrolledBottom });
  }

  private handleHistoryFetch(response: FetchMessagesResponse) {
    const newMessages = (response.channels[this.context.channel] as MessageListMessage[]) || [];
    const allMessages = [...this.state.messages, ...newMessages].sort(
      (a, b) => (a.timetoken as number) - (b.timetoken as number)
    );

    this.fetchMessageSenders(newMessages);
    this.setState({
      messages: allMessages,
      pagination: allMessages[0].timetoken as number,
      paginationEnd: newMessages.length !== this.state.messagesPerPage,
    });
  }

  private handleOnMessage(message: MessageEvent) {
    this.fetchMessageSenders([message]);
    this.setState({ messages: [...this.state.messages, message] });
    this.setupBottomObserver();
    if (this.props.onMessage) this.props.onMessage(message);

    if (this.state.scrolledBottom) {
      this.scrollToBottom();
    } else {
      this.setState({ unreadMessages: this.state.unreadMessages + 1 });
    }
  }

  /*
  /* Lifecycle
  */

  async componentDidMount(): Promise<void> {
    try {
      if (!this.context.pubnub)
        throw "Message List has no access to context. Please make sure to wrap the components around with PubNubProvider.";
      if (!this.context.channel.length)
        throw "PubNubProvider was initialized with an empty channel name.";

      this.context.pubnub.addListener({ message: (m) => this.handleOnMessage(m) });
      this.context.pubnub.subscribe({ channels: [this.context.channel] });

      if (this.props.disableHistoryFetch) return;
      const history = await this.context.pubnub.fetchMessages({
        channels: [this.context.channel],
        count: this.state.messagesPerPage,
      });
      this.handleHistoryFetch(history);
      this.scrollToBottom();
      this.setupSpinnerObserver();
      this.setupBottomObserver();
    } catch (e) {
      console.error(e);
    }
  }

  /*
  /* Renderers
  */

  render(): JSX.Element {
    if (!this.context.pubnub || !this.context.channel.length) return null;
    const { listRef, spinnerRef, endRef } = this;
    const { disableHistoryFetch, theme, onScroll } = this.props;
    const { paginationEnd, messages, unreadMessages } = this.state;

    return (
      <div className={`pn-msg-list pn-msg-list--${theme}`} onScroll={onScroll}>
        <div className="pn-msg-list__wrapper" ref={listRef}>
          {!disableHistoryFetch && !paginationEnd && (
            <span ref={spinnerRef} className="pn-msg-list__spinner">
              <SpinnerIcon />
            </span>
          )}

          {messages.map((m) => this.renderItem(m))}

          <div className="pn-msg-list__bottom-ref" ref={endRef}></div>

          {unreadMessages > 0 && (
            <div className="pn-msg-list__unread" onClick={() => this.scrollToBottom()}>
              {unreadMessages} new messages ↓
            </div>
          )}
        </div>
      </div>
    );
  }

  private renderItem(message: MessageListMessage) {
    const uuid = message.uuid || message.publisher || "";
    const currentUserClass = this.isOwnMessage(uuid) ? "pn-msg--own" : "";

    return (
      <div className={`pn-msg ${currentUserClass}`} key={message.timetoken}>
        {this.renderMessage(message)}
      </div>
    );
  }

  private renderMessage(message: MessageListMessage) {
    const uuid = message.uuid || message.publisher || "";
    const user = this.getUser(uuid);
    const time = this.getTime(message.timetoken as number);
    const isOwnMessage = this.isOwnMessage(uuid);

    if (this.props.messageRenderer)
      return this.props.messageRenderer({ message, user, time, isOwnMessage });

    return (
      <>
        {user && user.profileUrl && (
          <div className="pn-msg__avatar">
            <img src={user?.profileUrl} alt="User avatar " />
          </div>
        )}
        <div className="pn-msg__main">
          <div className="pn-msg__title">
            <span className="pn-msg__author">{user?.name || "Unknown User"}</span>
            <span className="pn-msg__time">{time}</span>
          </div>
          <div className="pn-msg__bubble">{message.message.text}</div>
        </div>
      </>
    );
  }
}
