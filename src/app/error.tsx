"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // This will be picked up by DebugProvider console patch and server logs
    console.error("GlobalErrorBoundary", { message: error.message, stack: error.stack, digest: error.digest });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h2>Something went wrong</h2>
          <p>{error?.message}</p>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}


