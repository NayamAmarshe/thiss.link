import type { OpenNextConfig } from "@opennextjs/aws/types/open-next";
// import cache from "@opennextjs/cloudflare/dist/api/kvCache";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      // Set `incrementalCache` to "dummy" to disable KV cache
      // incrementalCache: async () => cache,
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },

  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
};

export default config;
