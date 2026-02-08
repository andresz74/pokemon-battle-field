import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PokemonProvider } from "../context/PokemonContext";

const SITE_URL = "https://pokemon.dontmissthis.click";
const SOCIAL_IMAGE_PATH = "/social-preview.svg";
const SOCIAL_IMAGE_URL = `${SITE_URL}${SOCIAL_IMAGE_PATH}`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PokemonProvider>
      <Head>
        <title>Pokemon Battle Field</title>
        <meta
          name="description"
          content="Multiplayer turn-based Pokemon battles powered by Cloudflare Workers."
        />
        <meta name="robots" content="index,follow" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="Pokemon Battle Field" />
        <meta property="og:title" content="Pokemon Battle Field" />
        <meta
          property="og:description"
          content="Multiplayer turn-based Pokemon battles powered by Cloudflare Workers."
        />
        <meta property="og:image" content={SOCIAL_IMAGE_URL} />
        <meta property="og:image:secure_url" content={SOCIAL_IMAGE_URL} />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Pokemon Battle Field social preview" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pokemon Battle Field" />
        <meta
          name="twitter:description"
          content="Multiplayer turn-based Pokemon battles powered by Cloudflare Workers."
        />
        <meta name="twitter:image" content={SOCIAL_IMAGE_URL} />
        <meta name="twitter:image:alt" content="Pokemon Battle Field social preview" />
      </Head>
      <Component {...pageProps} />
    </PokemonProvider>
  );
}
