/**
 * Browser stand-in for react-native-webview, used only to run the real app in
 * end-to-end tests. Like the native WebView it loads `source.html`, exposes
 * `window.ReactNativeWebView.postMessage` to the page, delivers its messages to
 * `onMessage`, and runs `injectJavaScript` inside the page.
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

type Props = {
  source: { html: string };
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  style?: unknown;
  testID?: string;
};

const BRIDGE = `<script>window.ReactNativeWebView={postMessage:function(d){parent.postMessage({__webViewShim:true,data:d},'*')}};</script>`;

export const WebView = forwardRef(function WebView({ source, onMessage, testID }: Props, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const html = useMemo(() => source.html.replace('<head>', `<head>${BRIDGE}`), [source.html]);

  useImperativeHandle(ref, () => ({
    injectJavaScript: (js: string) => (frame.current?.contentWindow as (Window & { eval(code: string): unknown }) | null)?.eval(js),
  }));

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && event.data?.__webViewShim) {
        onMessageRef.current?.({ nativeEvent: { data: event.data.data } });
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return <iframe ref={frame} srcDoc={html} data-testid={testID} title={testID ?? 'webview'} style={{ flex: 1, border: 0, width: '100%', height: '100%' }} />;
});

export type WebViewMessageEvent = { nativeEvent: { data: string } };
