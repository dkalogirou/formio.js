// Minimal DOM stand-ins for the React Native primitives the component uses.
import type { ReactNode } from 'react';

type Props = { children?: ReactNode; style?: unknown; testID?: string };

const flatten = (style: unknown): Record<string, unknown> =>
  Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : ((style as Record<string, unknown>) ?? {});

export const View = ({ children, style, testID }: Props) => (
  <div data-testid={testID} data-style={JSON.stringify(flatten(style))}>
    {children}
  </div>
);
export const Text = ({ children, testID }: Props) => <span data-testid={testID}>{children}</span>;
export const ActivityIndicator = () => <div data-testid="spinner" />;
export const StyleSheet = { create: <T,>(styles: T) => styles, absoluteFillObject: { position: 'absolute' } };
export const Linking = { openURL: vi.fn(() => Promise.resolve()) };
export type StyleProp<T> = T | T[] | undefined;
export type ViewStyle = Record<string, unknown>;
