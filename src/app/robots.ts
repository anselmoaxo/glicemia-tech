import type { MetadataRoute } from "next";

// Só a página inicial é pública para buscadores; áreas com dados pessoais ficam de fora.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/r/", "/convite/", "/demo", "/inicio", "/glicemia", "/familia", "/relatorios"],
    },
  };
}
