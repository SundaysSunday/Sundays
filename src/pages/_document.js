import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet"/>
        <link rel="icon" type="image/x-icon" href="https://github.com/SundaysSunday/Sundays/blob/main/images/Sundays%20Favicon.svg" />

        
        <meta property="og:title" content="Sundays" />
        <meta property='og:description' content="Share a Meal at Sundays" />
        <meta property="og:image" content="https://github.com/SundaysSunday/Sundays/blob/main/images/Sundays_Only_Transparent_320x320.png" />

      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
