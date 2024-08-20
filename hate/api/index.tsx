import { Button, Frog, TextInput } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// };

// Hardcoded Gemini API Key
const apiKey = 'AIzaSyC3nb2XCEmyreplacethiscOjpY5GVAHDKlM';
const genAI = new GoogleGenerativeAI(apiKey);

const jimmyJohnModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  systemInstruction: "Your name is Jimmy John, you're a helpful assistant that helps users.",
});

const coingeckoModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  systemInstruction: 'Your name is CoinGecko Specialist, and you rewrite any given cryptocurrency name or symbol as the CoinGecko API coin ID.',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Frog Frame',
  metaTags: [
    { property: 'fc:frame', content: 'vNext' },
    { property: 'fc:frame:image', content: '' }, // This will be updated dynamically
    { property: 'og:image', content: '' }, // This will be updated dynamically
  ],
});

app.frame('/', async (c) => {
  const { inputText, buttonValue, status } = c;
  let responseMessage = '';

  if (buttonValue === 'get_response' && inputText) {
    try {
      const chatSession = jimmyJohnModel.startChat({
        generationConfig,
        history: [],
      });

      const result = await chatSession.sendMessage(inputText);

      responseMessage = result.response.text(); // Extract the AI-generated text
    } catch (error) {
      responseMessage = `Error: ${error.message}`;
    }
  } else if (buttonValue === 'search_price' && inputText) {
    try {
      const chatSession = coingeckoModel.startChat({
        generationConfig,
        history: [],
      });

      const result = await chatSession.sendMessage(inputText);

      const coinId = result.response.text().trim(); // Extract the AI-generated CoinGecko ID

      // Fetch the price using the CoinGecko API
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      const prices = await response.json();

      const price = prices[coinId]?.usd;

      if (price) {
        responseMessage = `The current price of ${coinId.toUpperCase()} is $${price}`;
      } else {
        responseMessage = 'Price not available';
      }
    } catch (error) {
      responseMessage = `Error: ${error.message}`;
    }
  }

  // Set the dynamic image URL based on the AI response
  const imageUrl = `https://your-domain.vercel.app/api/og?text=${encodeURIComponent(responseMessage)}`;

  return c.res({
    metaTags: {
      'fc:frame:image': imageUrl,
      'og:image': imageUrl,
    },
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 'calc(16px + 1.5vw)', // Responsive font size based on viewport width
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            maxHeight: '100%', // Ensure it doesn't overflow the container
            overflow: 'hidden', // Prevent overflow and clip content
          }}
        >
          {status === 'response'
            ? `AI Response:\n${responseMessage}`
            : 'Welcome! Enter text or coin name.'}
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter text or coin..." />, // Shortened placeholder text
      <Button value="get_response">Get AI Response</Button>,
      <Button value="search_price">Search Price</Button>,
      status === 'response' && <Button.Reset>Reset</Button.Reset>,
    ],
    url: imageUrl, // Include the dynamic image URL
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined';
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development';
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
