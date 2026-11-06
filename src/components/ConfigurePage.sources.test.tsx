import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  registerWidget,
  SourcePickerProvider,
  type LinkedSource,
  type SourcePickerFn,
} from '@firstform/campus-hub-widget-sdk';
import ConfigurePage from './ConfigurePage';
import { normalizeConfig, type DisplayConfig } from '../lib/config';

// Only browser-only layout/history plumbing is stubbed; the sidebar, shared
// source bridge and engine editor run together with a schema-only plugin.
vi.mock('../lib/dashboard-history', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/dashboard-history')>();
  return {
    ...actual,
    listDashboardHistory: vi.fn(async () => []),
    saveDashboardHistory: vi.fn(async () => []),
  };
});
vi.mock('../lib/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/config')>();
  return { ...actual, generateShareUrl: vi.fn(async () => '/preview?sample') };
});

registerWidget({
  type: 'configurator-shared-source-test',
  name: 'Shared source test',
  description: 'Schema-only plugin used to exercise the shared source flow',
  icon: 'calendar',
  minW: 1,
  minH: 1,
  defaultW: 3,
  defaultH: 2,
  component: () => <span>Sample news</span>,
  optionsSchema: [{ name: 'headline', label: 'Headline', fieldType: 'string' }],
  acceptsSources: [{ propName: 'feedUrl', types: ['feed'] }],
});

const initialConfig = normalizeConfig({
  layout: [{
    id: 'news-1', type: 'configurator-shared-source-test',
    x: 0, y: 0, w: 3, h: 2, props: { headline: 'Campus news' },
  }],
});

const createdSource: LinkedSource = {
  _id: 'saved-news-source',
  name: 'New campus feed',
  url: 'https://example.edu/news.xml',
  sourceType: 'feed',
};

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.removeAttribute('open'); },
  });
});

afterAll(() => {
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
  else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
  else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
});

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    media: query,
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ConfigurePage shared sources', () => {
  it.each(['prop', 'provider'] as const)('adds the first source through the host %s and saves it to the widget', async (bridge) => {
    const user = userEvent.setup();
    const onChange = vi.fn<(config: DisplayConfig) => void>();
    const openSourceWorkflow = vi.fn<SourcePickerFn>();
    const editor = (
      <ConfigurePage
        initialConfig={initialConfig}
        enableBrowserPersistence={false}
        sources={[]}
        onPickSource={bridge === 'prop' ? openSourceWorkflow : undefined}
        onChange={onChange}
      />
    );
    render(bridge === 'provider'
      ? <SourcePickerProvider value={openSourceWorkflow}>{editor}</SourcePickerProvider>
      : editor);

    // A schema-only plugin must have the same Configure path as a custom form.
    await user.click(screen.getByRole('button', { name: 'Configure Shared source test' }));
    await user.click(screen.getByRole('button', { name: 'Add source' }));
    expect(openSourceWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      widgetType: 'configurator-shared-source-test',
      initialTab: 'create',
      bindings: [expect.objectContaining({ propName: 'feedUrl', types: ['feed'] })],
    }));

    // The source-list subscription is still empty when the create modal returns.
    act(() => openSourceWorkflow.mock.calls[0][0].onSelect(createdSource));
    expect(screen.getByText('New campus feed')).toBeInTheDocument();
    expect(onChange.mock.lastCall?.[0].layout[0].props).toEqual({ headline: 'Campus news' });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(onChange.mock.lastCall?.[0].layout[0].props).toEqual({
      headline: 'Campus news',
      feedUrl: createdSource.url,
      __sourceRef: { sourceId: createdSource._id, propName: 'feedUrl' },
    });
  });

  it('keeps the template unchanged when the source workflow and widget editor are cancelled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(config: DisplayConfig) => void>();
    const openSourceWorkflow = vi.fn<SourcePickerFn>();
    render(
      <ConfigurePage
        initialConfig={initialConfig}
        enableBrowserPersistence={false}
        sources={[]}
        onPickSource={openSourceWorkflow}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Configure Shared source test' }));
    await user.click(screen.getByRole('button', { name: 'Browse source store' }));
    expect(openSourceWorkflow.mock.calls[0][0].initialTab).toBe('store');
    // Cancelling the host modal means no onSelect call.
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange.mock.lastCall?.[0].layout[0].props).toEqual({ headline: 'Campus news' });
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  });
});
