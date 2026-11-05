// Demo presets for Campus Hub

import type { DisplayConfig, IconName } from '@firstform/campus-hub-engine';

/** Self-contained sample artwork: starter layouts never fetch stock photos. */
function sampleImage(title: string, accent = '#54d3a7'): string {
  const text = title.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[char]!);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#142b34"/><circle cx="1050" cy="150" r="260" fill="${accent}" opacity=".18"/><path d="M0 650L340 390L650 650L930 470L1200 650V800H0Z" fill="${accent}" opacity=".3"/><text x="80" y="350" fill="white" font-family="sans-serif" font-size="64">${text}</text><text x="84" y="420" fill="${accent}" font-family="sans-serif" font-size="28">Sample content</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  config: DisplayConfig;
}

export const DEMO_PRESETS: Preset[] = [
  {
    id: 'campus-classic',
    name: 'Campus Classic',
    description: 'Traditional campus display with clock, events, and news',
    icon: 'school',
    config: {
      layout: [
        { id: 'clock-1', type: 'clock', x: 9, y: 0, w: 3, h: 1, props: { showSeconds: true, showDate: true, format24h: false } },
        { id: 'poster-1', type: 'poster-carousel', x: 0, y: 0, w: 6, h: 5, props: {
          rotationSeconds: 8,
          posters: [
            { imageUrl: sampleImage('Welcome to Campus'), title: 'Welcome to Campus', description: 'Sample semester announcement' },
            { imageUrl: sampleImage('Graduation Day', '#eab670'), title: 'Graduation Day', description: 'Sample event announcement' },
            { imageUrl: sampleImage('Study Abroad Fair', '#b4a2f5'), title: 'Study Abroad Fair', description: 'Sample student event' },
          ]
        }},
        { id: 'events-1', type: 'events-list', x: 6, y: 1, w: 6, h: 4, props: {
          title: 'Upcoming Events',
          maxItems: 5,
          events: [
            { title: 'Career Fair', date: '2026-02-15', time: '10:00 AM', location: 'Main Hall' },
            { title: 'Basketball Game', date: '2026-02-16', time: '7:00 PM', location: 'Sports Arena' },
            { title: 'Guest Lecture: AI Ethics', date: '2026-02-18', time: '2:00 PM', location: 'Auditorium A' },
            { title: 'Club Rush', date: '2026-02-20', time: '11:00 AM', location: 'Student Plaza' },
          ]
        }},
        { id: 'news-ticker-1', type: 'news-ticker', x: 0, y: 7, w: 12, h: 1 },
      ],
      theme: { primary: '#035642', accent: '#B79527', background: '#022b21' },
      schoolName: 'Campus Hub',
      tickerEnabled: true,
    },
  },
  {
    id: 'media-showcase',
    name: 'Media Showcase',
    description: 'Video and image-focused display for visual content',
    icon: 'film',
    config: {
      layout: [
        { id: 'youtube-1', type: 'youtube', x: 0, y: 0, w: 8, h: 5, props: {
          videoId: '',
          autoplay: false,
          muted: true,
          loop: true,
        }},
        { id: 'image-1', type: 'image', x: 8, y: 0, w: 4, h: 2, props: {
          url: sampleImage('Study Together', '#e94560'),
          alt: 'Sample study announcement',
          fit: 'cover',
        }},
        { id: 'image-2', type: 'image', x: 8, y: 2, w: 4, h: 3, props: {
          url: sampleImage('Campus Life', '#b4a2f5'),
          alt: 'Sample campus announcement',
          fit: 'cover',
        }},
        { id: 'clock-1', type: 'clock', x: 0, y: 5, w: 3, h: 1, props: { showSeconds: false, showDate: true } },
        { id: 'news-ticker-1', type: 'news-ticker', x: 0, y: 7, w: 12, h: 1 },
      ],
      theme: { primary: '#1a1a2e', accent: '#e94560', background: '#16213e' },
      schoolName: 'Media Center',
      tickerEnabled: true,
    },
  },
  {
    id: 'minimal-info',
    name: 'Minimal Info',
    description: 'Clean, minimalist layout with essential information',
    icon: 'sparkles',
    config: {
      layout: [
        { id: 'clock-1', type: 'clock', x: 4, y: 2, w: 4, h: 2, props: { showSeconds: false, showDate: true, format24h: true } },
        { id: 'weather-1', type: 'weather', x: 4, y: 4, w: 4, h: 2, props: {
          units: 'metric',
        }},
      ],
      theme: { primary: '#0f0f0f', accent: '#ffffff', background: '#000000' },
      schoolName: 'Info Display',
      tickerEnabled: false,
    },
  },
  {
    id: 'events-focus',
    name: 'Events Focus',
    description: 'Large events list with supporting content',
    icon: 'calendar',
    config: {
      layout: [
        { id: 'events-1', type: 'events-list', x: 0, y: 0, w: 7, h: 5, props: {
          title: 'This Week on Campus',
          maxItems: 8,
          events: [
            { title: 'Monday Meditation', date: '2026-02-10', time: '7:00 AM', location: 'Wellness Center' },
            { title: 'Chess Club Meeting', date: '2026-02-10', time: '4:00 PM', location: 'Room 201' },
            { title: 'Open Mic Night', date: '2026-02-11', time: '8:00 PM', location: 'Campus Cafe' },
            { title: 'Research Symposium', date: '2026-02-12', time: '9:00 AM', location: 'Science Building' },
            { title: 'Yoga Class', date: '2026-02-12', time: '6:00 PM', location: 'Gym' },
            { title: 'Film Screening', date: '2026-02-13', time: '7:30 PM', location: 'Theater' },
            { title: 'Volunteer Day', date: '2026-02-14', time: '10:00 AM', location: 'Meet at Main Gate' },
            { title: 'Valentine Dance', date: '2026-02-14', time: '8:00 PM', location: 'Ballroom' },
          ]
        }},
        { id: 'clock-1', type: 'clock', x: 7, y: 0, w: 5, h: 1, props: { showSeconds: true, showDate: true } },
        { id: 'poster-1', type: 'poster-carousel', x: 7, y: 1, w: 5, h: 4, props: {
          rotationSeconds: 6,
          posters: [
            { imageUrl: sampleImage('Events This Week'), title: 'Events This Week', description: 'Sample event announcement' },
            { imageUrl: sampleImage('Get Involved', '#eab670'), title: 'Get Involved', description: 'Sample club announcement' },
          ]
        }},
        { id: 'news-ticker-1', type: 'news-ticker', x: 0, y: 7, w: 12, h: 1 },
      ],
      theme: { primary: '#2d3436', accent: '#00b894', background: '#1e272e' },
      schoolName: 'Events Board',
      tickerEnabled: true,
    },
  },
  {
    id: 'web-dashboard',
    name: 'Web Dashboard',
    description: 'Sample layout for websites and information; choose sources to connect live content',
    icon: 'globe',
    config: {
      layout: [
        { id: 'web-1', type: 'web', x: 0, y: 0, w: 8, h: 5, props: {
          url: '',
          refreshInterval: 300,
        }},
        { id: 'clock-1', type: 'clock', x: 8, y: 0, w: 4, h: 1, props: { showSeconds: true, showDate: true } },
        { id: 'weather-1', type: 'weather', x: 8, y: 1, w: 4, h: 3, props: {
          units: 'metric',
        }},
      ],
      theme: { primary: '#2c3e50', accent: '#3498db', background: '#1a252f' },
      schoolName: 'Web Dashboard',
      tickerEnabled: false,
    },
  },
  {
    id: 'slideshow-gallery',
    name: 'Photo Gallery',
    description: 'Slideshow with local sample artwork',
    icon: 'image',
    config: {
      layout: [
        { id: 'slideshow-1', type: 'slideshow', x: 0, y: 0, w: 9, h: 5, props: {
          duration: 5,
          transition: 'fade',
          showCaptions: true,
          showProgress: true,
          slides: [
            { url: sampleImage('Welcome to Our Campus'), caption: 'Sample welcome slide' },
            { url: sampleImage('Campus Spaces', '#b4a2f5'), caption: 'Sample facilities slide' },
            { url: sampleImage('Celebrating Excellence', '#eab670'), caption: 'Sample celebration slide' },
            { url: sampleImage('Around Campus', '#3498db'), caption: 'Sample campus slide' },
            { url: sampleImage('Global Opportunities', '#e94560'), caption: 'Sample opportunities slide' },
          ]
        }},
        { id: 'clock-1', type: 'clock', x: 9, y: 0, w: 3, h: 1, props: { showSeconds: false, showDate: true } },
        { id: 'events-1', type: 'events-list', x: 9, y: 1, w: 3, h: 4, props: {
          title: 'Today',
          maxItems: 4,
          events: [
            { title: 'Campus Tour', time: '10:00 AM' },
            { title: 'Info Session', time: '2:00 PM' },
            { title: 'Q&A Panel', time: '4:00 PM' },
          ]
        }},
        { id: 'news-ticker-1', type: 'news-ticker', x: 0, y: 7, w: 12, h: 1 },
      ],
      theme: { primary: '#1b4332', accent: '#d4a373', background: '#081c15' },
      schoolName: 'Photo Gallery',
      tickerEnabled: true,
    },
  },
];

export function getPreset(id: string): Preset | undefined {
  return DEMO_PRESETS.find((p) => p.id === id);
}

