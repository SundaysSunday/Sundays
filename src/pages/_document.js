import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet"/>
        <link rel="icon" type="image/svg+xml" href="https://raw.githubusercontent.com/SundaysSunday/Sundays/9855eb40655cb6a8c1941a509016656440e8066e/images/Sundays%20Favicon.svg" />

        <title>Sundays</title>
        <meta name="description" content="Share a Meal at Sundays"></meta>
        <meta property="og:title" content="Sundays" />                
        <meta property="og:site_name" content="Sundays"/>
        <meta property='og:description' content="Share a Meal at Sundays" />
        <meta property="og:image" content="https://raw.githubusercontent.com/SundaysSunday/Sundays/refs/heads/main/images/Instagram_Logo_Transparent_320x320.png" />

      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
