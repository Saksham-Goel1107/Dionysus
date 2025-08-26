import { NextResponse } from 'next/server';

const quoteAPIs = [
  {
    name: 'quotable',
    url: 'https://api.quotable.io/random?maxLength=100',
    transform: (data: any) => ({ text: data.content, author: data.author }),
  },
  {
    name: 'zenquotes',
    url: 'https://zenquotes.io/api/random',
    transform: (data: any) => ({ text: data[0].q, author: data[0].a }),
  },
  {
    name: 'dummyjson',
    url: 'https://dummyjson.com/quotes/random',
    transform: (data: any) => ({ text: data.quote, author: data.author }),
  },
];

const fallbackQuotes = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { text: "Code is like humor. When you explain it, it's bad.", author: 'Cory House' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
];

export async function GET() {
  const shuffledAPIs = [...quoteAPIs].sort(() => Math.random() - 0.5);

  for (const api of shuffledAPIs) {
    try {
      const response = await fetch(api.url, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const quote = api.transform(data);

        if (quote.text.length <= 100) {
          return NextResponse.json(quote);
        }
      }
    } catch {
      continue;
    }
  }

  const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
  return NextResponse.json(fallbackQuotes[randomIndex]);
}
