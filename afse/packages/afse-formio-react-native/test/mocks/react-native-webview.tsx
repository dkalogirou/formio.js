import { forwardRef, useImperativeHandle } from 'react';
import { decode, encode, type FromHost, type ToHost } from '../../src/protocol';

type Props = Record<string, any>;

/** Records what the component does with its WebView and lets tests play the page. */
export const webViewMock = {
  props: {} as Props,
  injected: [] as string[],
  reset() {
    this.props = {};
    this.injected = [];
  },
  /** Messages the component sent to the page. */
  sent(): ToHost[] {
    return this.injected.map((js) => {
      const literal = js.match(/^window\.__afseReceive\((.*)\);true;$/s)?.[1];
      return decode<ToHost>(JSON.parse(literal!))!;
    });
  },
  /** Simulates the page posting a message to the app. */
  emit(message: FromHost) {
    this.props.onMessage({ nativeEvent: { data: encode(message) } });
  },
};

export const WebView = forwardRef((props: Props, ref) => {
  webViewMock.props = props;
  useImperativeHandle(ref, () => ({ injectJavaScript: (js: string) => webViewMock.injected.push(js) }));
  return <div data-testid={props.testID ?? 'webview'} />;
});

export type WebViewMessageEvent = { nativeEvent: { data: string } };
