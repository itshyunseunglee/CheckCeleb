import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CheckCeleb - YouTube Channel Analytics';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f0f0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span style={{ color: '#ff0000', fontSize: 96, fontWeight: 900 }}>Check</span>
          <span style={{ color: '#ffffff', fontSize: 96, fontWeight: 900 }}>Celeb</span>
        </div>
        <p style={{ color: '#888888', fontSize: 32, margin: 0 }}>
          YouTube Channel Analytics Dashboard
        </p>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 16,
          }}
        >
          {['Views Trend', 'Engagement', 'Upload Timing', 'Word Cloud'].map((label) => (
            <div
              key={label}
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 12,
                padding: '10px 20px',
                color: '#aaaaaa',
                fontSize: 22,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
