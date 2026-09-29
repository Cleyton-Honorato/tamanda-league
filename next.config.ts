import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },

  // As três páginas viraram abas de /campeonato; os endereços antigos seguem
  // válidos para quem tiver salvo o link.
  async redirects() {
    return [
      { source: "/jogos", destination: "/campeonato", permanent: true },
      { source: "/classificacao", destination: "/campeonato", permanent: true },
      {
        source: "/chaveamento",
        destination: "/campeonato?fase=mata-mata",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
