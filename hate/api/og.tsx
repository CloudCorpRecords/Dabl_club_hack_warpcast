import { ImageResponse } from '@vercel/og';

// Set the runtime to edge for better performance
export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || 'Default Text';

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          color: 'black',
          background: 'white',
          width: '100%',
          height: '100%',
          padding: '50px 200px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
        }}
      >
        {text}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}