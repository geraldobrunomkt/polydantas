/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Videos vao para o Drive (sem limite pratico); fotos/carrossel para o
      // Supabase Storage (teto de 50MB por arquivo la). 200MB cobre os dois
      // com folga, considerando tambem que um carrossel manda varios arquivos
      // na mesma requisicao.
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
