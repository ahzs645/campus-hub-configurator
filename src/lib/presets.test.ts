import { describe, expect, it } from 'vitest';
import { DEMO_PRESETS, getPreset } from './presets';

function stringLeaves(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringLeaves);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringLeaves);
  return [];
}

describe('source-free starter layouts', () => {
  it.each(DEMO_PRESETS)('$name never includes a live network destination', ({ config }) => {
    const externalDestinations = stringLeaves(config).filter((value) => /^(?:https?:|wss?:|\/\/)/i.test(value));
    expect(externalDestinations).toEqual([]);
    for (const widget of config.layout) {
      expect(widget.props ?? {}).not.toHaveProperty('__sourceRef');
    }
  });

  it('keeps sample illustrations self-contained and visibly labelled', () => {
    const images = DEMO_PRESETS.flatMap(({ config }) => stringLeaves(config))
      .filter((value) => value.startsWith('data:image/'));
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image).toMatch(/^data:image\/svg\+xml,/);
      const svg = new DOMParser().parseFromString(decodeURIComponent(image.split(',')[1]), 'image/svg+xml');
      expect(svg.querySelector('parsererror')).toBeNull();
      expect(svg.documentElement.tagName).toBe('svg');
      expect(svg.documentElement.textContent).toContain('Sample content');
      expect(svg.querySelector('image, use, script, foreignObject, [href], [src]')).toBeNull();
    }
  });

  it('leaves embedded video, websites and weather unconfigured until a source is chosen', () => {
    const widgets = DEMO_PRESETS.flatMap(({ config }) => config.layout);
    for (const widget of widgets.filter(({ type }) => type === 'youtube')) {
      expect(widget.props?.videoId).toBe('');
      expect(widget.props?.autoplay).toBe(false);
    }
    for (const widget of widgets.filter(({ type }) => type === 'web')) {
      expect(widget.props?.url).toBe('');
    }
    for (const widget of widgets.filter(({ type }) => type === 'weather')) {
      expect(widget.props).not.toHaveProperty('location');
      expect(widget.props).not.toHaveProperty('latitude');
      expect(widget.props).not.toHaveProperty('longitude');
      expect(widget.props).not.toHaveProperty('feedUrl');
    }
    expect(getPreset('campus-classic')?.config.layout.length).toBeGreaterThan(0);
  });
});
