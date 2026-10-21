import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Linking } from 'react-native';
import { AfseForm, AfseProvider, AfseSubmissionView, defineForm, fields, useAfseForm, validators, type AfseMobileFormHandle } from '../src';
import { webViewMock } from './mocks/react-native-webview';

const form = defineForm({ fields: [fields.iban({ key: 'iban', label: 'IBAN', required: true })] });

function boot() {
  act(() => webViewMock.emit({ type: 'boot' }));
}

function lastCommand() {
  const commands = webViewMock.sent().filter((m) => m.type === 'command');
  return commands[commands.length - 1] as Extract<ReturnType<typeof webViewMock.sent>[number], { type: 'command' }>;
}

describe('mobile AfseForm', () => {
  it('loads the bundled form page and configures it once the page boots', () => {
    render(<AfseForm form={form} language="el" />);
    expect(webViewMock.props.source.html).toContain('<div id="root"></div>');
    // A real origin, so cookies and storage work in Android's WebView.
    expect(webViewMock.props.source.baseUrl).toBe('https://afse-forms.invalid/');
    expect(webViewMock.props.onShouldStartLoadWithRequest({ url: 'https://afse-forms.invalid/' })).toBe(true);
    expect(webViewMock.props.domStorageEnabled).toBe(true);
    expect(webViewMock.sent()).toEqual([]);
    boot();
    expect(webViewMock.sent()).toEqual([
      { type: 'configure', config: expect.objectContaining({ form, language: 'el', readOnly: false, autoHeight: false }) },
    ]);
  });

  it('shows a spinner until the form is ready', () => {
    const onReady = vi.fn();
    render(<AfseForm form={form} onReady={onReady} />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    boot();
    act(() => webViewMock.emit({ type: 'ready' }));
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    expect(onReady).toHaveBeenCalledOnce();
  });

  it('shows why the form failed to load instead of spinning forever', () => {
    const onError = vi.fn();
    render(<AfseForm form={form} onError={onError} testID="payment" />);
    boot();
    act(() => webViewMock.emit({ type: 'error', message: 'Unknown component: afseFoo' }));
    expect(screen.getByTestId('payment-error')).toHaveTextContent('The form could not be loaded.');
    expect(screen.getByTestId('payment-error')).toHaveTextContent('Unknown component: afseFoo');
    expect(onError).toHaveBeenCalledWith('Unknown component: afseFoo');
    act(() => webViewMock.emit({ type: 'ready' }));
    expect(screen.queryByTestId('payment-error')).not.toBeInTheDocument();
  });

  it('forwards page events to the callbacks', () => {
    const handlers = {
      onSubmit: vi.fn(),
      onChange: vi.fn(),
      onValidationError: vi.fn(),
      onPageChange: vi.fn(),
      onCustomEvent: vi.fn(),
      onError: vi.fn(),
    };
    render(<AfseForm form={form} {...handlers} />);
    boot();
    act(() => {
      webViewMock.emit({ type: 'submit', submission: { data: { iban: 'GR16' } } });
      webViewMock.emit({ type: 'change', change: { data: { iban: 'G' }, modifiedByUser: true } });
      webViewMock.emit({ type: 'validationError', errors: [{ path: 'iban', message: 'bad' }] });
      webViewMock.emit({ type: 'pageChange', page: 2 });
      webViewMock.emit({ type: 'customEvent', name: 'help', data: { iban: '' } });
      webViewMock.emit({ type: 'error', message: 'boom' });
    });
    expect(handlers.onSubmit).toHaveBeenCalledWith({ data: { iban: 'GR16' } });
    expect(handlers.onChange).toHaveBeenCalledWith({ data: { iban: 'G' }, modifiedByUser: true });
    expect(handlers.onValidationError).toHaveBeenCalledWith([{ path: 'iban', message: 'bad' }]);
    expect(handlers.onPageChange).toHaveBeenCalledWith(2);
    expect(handlers.onCustomEvent).toHaveBeenCalledWith('help', { iban: '' });
    expect(handlers.onError).toHaveBeenCalledWith('boom');
  });

  it('ignores messages from other sources', () => {
    const onSubmit = vi.fn();
    render(<AfseForm form={form} onSubmit={onSubmit} />);
    act(() => {
      webViewMock.props.onMessage({ nativeEvent: { data: '{"type":"submit"}' } });
      webViewMock.props.onMessage({ nativeEvent: { data: 'hello' } });
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('resolves handle calls with the page result', async () => {
    const ref = createRef<AfseMobileFormHandle>();
    render(<AfseForm ref={ref} form={form} />);
    boot();

    const submitted = ref.current!.submit();
    const submit = lastCommand();
    expect(submit).toMatchObject({ command: 'submit', args: [] });
    act(() => webViewMock.emit({ type: 'result', id: submit.id, ok: true, value: { data: { iban: 'X' } } }));
    await expect(submitted).resolves.toEqual({ data: { iban: 'X' } });

    const setData = ref.current!.setData({ iban: 'Y' });
    expect(lastCommand()).toMatchObject({ command: 'setData', args: [{ iban: 'Y' }] });
    act(() => webViewMock.emit({ type: 'result', id: lastCommand().id, ok: true }));
    await expect(setData).resolves.toBeUndefined();
  });

  it('rejects submit with the validation errors', async () => {
    const ref = createRef<AfseMobileFormHandle>();
    render(<AfseForm ref={ref} form={form} />);
    boot();
    const submitted = ref.current!.submit();
    const errors = [{ path: 'iban', message: 'IBAN is required', rule: 'required' }];
    act(() => webViewMock.emit({ type: 'result', id: lastCommand().id, ok: false, message: 'invalid', errors }));
    await expect(submitted).rejects.toEqual(errors);
  });

  it('rejects calls before boot and pending calls on unmount', async () => {
    const ref = createRef<AfseMobileFormHandle>();
    const { unmount } = render(<AfseForm ref={ref} form={form} />);
    await expect(ref.current!.getData()).rejects.toThrow('not ready');
    boot();
    const pending = ref.current!.getData();
    unmount();
    await expect(pending).rejects.toThrow('unmounted');
  });

  it('re-sends configuration when props change, but not for equal values', () => {
    const { rerender } = render(<AfseForm form={form} data={{ iban: 'A' }} />);
    boot();
    rerender(<AfseForm form={form} data={{ iban: 'A' }} />);
    expect(webViewMock.sent()).toHaveLength(1);
    rerender(<AfseForm form={form} data={{ iban: 'B' }} readOnly />);
    expect(webViewMock.sent()).toHaveLength(2);
    expect(webViewMock.sent()[1]).toMatchObject({ type: 'configure', config: { data: { iban: 'B' }, readOnly: true } });
  });

  it('reconfigures a page that reloaded', () => {
    render(<AfseForm form={form} />);
    boot();
    boot();
    expect(webViewMock.sent().filter((m) => m.type === 'configure')).toHaveLength(2);
  });

  it('grows with its content when autoHeight is on', () => {
    render(<AfseForm form={form} autoHeight testID="payment" />);
    boot();
    act(() => webViewMock.emit({ type: 'height', height: 640 }));
    expect(JSON.parse(screen.getByTestId('payment').dataset.style!)).toMatchObject({ height: 640 });
    expect(webViewMock.props.scrollEnabled).toBe(false);
  });

  it('takes language, translations and theme defaults from the provider', () => {
    render(
      <AfseProvider language="el" theme={{ primaryColor: '#123456', radius: 4 }} translations={{ el: { IBAN: 'ΙΒΑΝ' } }}>
        <AfseForm form={form} theme={{ radius: 12 }} translations={{ el: { Pay: 'Πληρωμή' } }} />
      </AfseProvider>,
    );
    boot();
    expect(webViewMock.sent()[0]).toMatchObject({
      config: {
        language: 'el',
        theme: { primaryColor: '#123456', radius: 12 },
        translations: { el: { IBAN: 'ΙΒΑΝ', Pay: 'Πληρωμή' } },
      },
    });
  });

  it('keeps the form page in place and opens followed links in the browser', () => {
    render(<AfseForm form={form} />);
    const guard = webViewMock.props.onShouldStartLoadWithRequest;
    expect(guard({ url: 'about:blank' })).toBe(true);
    expect(guard({ url: 'https://www.google.com/recaptcha/api2/anchor', isTopFrame: false })).toBe(true);
    // Android does not report navigationType, so every top-level link counts.
    expect(guard({ url: 'https://afse.eu/terms' })).toBe(false);
    expect(Linking.openURL).toHaveBeenCalledWith('https://afse.eu/terms');
    expect(guard({ url: 'javascript:alert(1)' })).toBe(false);
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
  });

  it('lets the page load from the configured baseUrl', () => {
    render(
      <AfseProvider baseUrl="https://forms.afse.eu">
        <AfseForm form={form} />
      </AfseProvider>,
    );
    const guard = webViewMock.props.onShouldStartLoadWithRequest;
    expect(webViewMock.props.source.baseUrl).toBe('https://forms.afse.eu');
    expect(guard({ url: 'https://forms.afse.eu/' })).toBe(true);
    expect(guard({ url: 'https://forms.afse.eu/#top' })).toBe(true);
  });

  it('passes data that looks like code through untouched', () => {
    const tricky = { iban: '");window.hacked=1;// </script>' };
    render(<AfseForm form={form} data={tricky} />);
    boot();
    expect(webViewMock.sent()[0]).toMatchObject({ config: { data: tricky } });
  });
});

describe('AfseSubmissionView', () => {
  it('renders read-only summary mode without submit buttons', () => {
    render(<AfseSubmissionView form={form} data={{ iban: 'GR16' }} />);
    boot();
    expect(webViewMock.sent()[0]).toMatchObject({
      config: { readOnly: true, summary: true, hideSubmitButton: true, data: { iban: 'GR16' } },
    });
  });
});

describe('useAfseForm', () => {
  it('drives the form through its ref', async () => {
    let api: ReturnType<typeof useAfseForm> | undefined;
    function Screen() {
      api = useAfseForm();
      return <AfseForm ref={api.ref} form={form} />;
    }
    render(<Screen />);
    boot();
    const validation = api!.validate();
    act(() => webViewMock.emit({ type: 'result', id: lastCommand().id, ok: true, value: [] }));
    await expect(validation).resolves.toEqual([]);
  });
});

describe('re-exports', () => {
  it('shares form helpers and validators with the web library', () => {
    expect(form.components[0]).toMatchObject({ type: 'afseIban' });
    expect(validators.greekTaxId('094014201')).toBe(true);
  });
});
