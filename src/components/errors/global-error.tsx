'use client'; // Error boundaries must be Client Components

// type GlobalErrorProps = {
//   error: Error & { digest?: string };
//   reset: () => void;
// };

export default function GlobalError() {
  const reset = () => {
    window.location.reload();
  };

  return (
    // global-error must include html and body tags
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
