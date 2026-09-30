// Service worker mínimo: habilita a instalação do PWA.
// Não faz cache de páginas nem de dados (dados de saúde nunca ficam no cache do navegador).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
