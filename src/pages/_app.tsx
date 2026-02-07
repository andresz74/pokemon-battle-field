import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PokemonProvider } from "../context/PokemonContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PokemonProvider>
      <Component {...pageProps} />
    </PokemonProvider>
  );
}
