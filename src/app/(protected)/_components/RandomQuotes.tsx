'use client';

import { useEffect, useState } from 'react';

interface Quote {
  text: string;
  author: string;
}

const fallbackQuotes: Quote[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { text: "Code is like humor. When you explain it, it's bad.", author: 'Cory House' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { text: 'Programs must be written for people to read.', author: 'Harold Abelson' },
  { text: 'Perfect is the enemy of good.', author: 'Voltaire' },
  { text: 'Premature optimization is the root of all evil.', author: 'Donald Knuth' },
  { text: 'Code never lies, comments sometimes do.', author: 'Ron Jeffries' },
  { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
];

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

export default function RandomQuotes() {
  const [quote, setQuote] = useState<Quote>(() => {
    const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
    return fallbackQuotes[randomIndex]!;
  });

  const fetchQuote = async () => {
    const shuffledAPIs = [...quoteAPIs].sort(() => Math.random() - 0.5);

    for (const api of shuffledAPIs) {
      try {
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const transformedQuote = api.transform(data);

          if (transformedQuote.text.length <= 100) {
            setQuote(transformedQuote);
            return;
          }
        }
      } catch (error) {
        console.log(`Failed to fetch from ${api.name}:`, error);
        continue;
      }
    }

    const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
    const randomFallback = fallbackQuotes[randomIndex] || {
      text: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs',
    };
    setQuote(randomFallback);
  };

  useEffect(() => {
    fetchQuote();

    const interval = setInterval(fetchQuote, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-4 hidden h-12 w-80 flex-shrink-0 items-center justify-center lg:flex">
      <div className="flex h-full w-full flex-col justify-center text-center">
        <blockquote className="line-clamp-2 overflow-hidden text-xs italic leading-tight text-gray-600 dark:text-gray-400">
          &quot;{quote.text}&quot;
        </blockquote>
        <cite className="mt-1 block truncate text-[10px] text-gray-500 dark:text-gray-500">
          — {quote.author}
        </cite>
      </div>
    </div>
  );
}
