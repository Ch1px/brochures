POST /api/liveblocks-auth 200 in 387ms (next.js: 20ms, proxy.ts: 64ms, application-code: 303ms)
 POST /admin/brochures/M5yxdnIFfo2xsqhUyZRVGZ/edit 200 in 1661ms (next.js: 17ms, proxy.ts: 20ms, application-code: 1624ms)
  └─ ƒ updateBrochureSettingsAction("M5yxdnIFfo2xsqhUyZRVGZ", {"accentColor":"#b76c70","backgroundColor":null,"bodyColor":null,"...":"22 items not stringified"}, "italian-grand-prix") in 1075ms src/lib/sanity/actions.ts
saveBrochure failed: Error: Mutation failed: Document "M5yxdnIFfo2xsqhUyZRVGZ" has unexpected revision ID ("UBS0CGlpAgCmKl30x8S9mv"), expected "UBS0CGlpAgCmKl30x8R1zf":
- Document "M5yxdnIFfo2xsqhUyZRVGZ" has unexpected revision ID ("UBS0CGlpAgCmKl30x8S9mv"), expected "UBS0CGlpAgCmKl30x8R1zf"
    at ignore-listed frames {
  response: {
    body: { error: [Object] },
    url: 'https://oo7diwt3.api.sanity.io/v2024-10-01/data/mutate/production?returnIds=true&returnDocuments=true&visibility=sync&autoGenerateArrayKeys=true',
    method: 'POST',
    headers: [Object: null prototype] {
      'alt-svc': 'h3=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=utf-8',
      date: 'Fri, 01 May 2026 00:05:05 GMT',
      'ratelimit-limit': '50',
      'ratelimit-remaining': '49',
      'ratelimit-reset': '1',
      'sanity-gateway': 'k8s-gcp-eu-w1-prod-ing-01',
      'sanity-inflight-current': '0',
      'sanity-inflight-limit': '100',
      'server-timing': 'api;dur=50',
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
      traceparent: '00-5443df3d867bffe00826c434188bce5c-f077729d67b56d39-01',
      'transfer-encoding': 'chunked',
      vary: 'Accept-Encoding, origin',
      via: '1.1 google',
      'x-ratelimit-limit-second': '50',
      'x-ratelimit-remaining-second': '49',
      'x-sanity-shard': 'gcp-eu-w1-01-prod-1019',
      'x-served-by': 'gradient-web-68b5d9bd-lgndf',
      xkey: 'project-oo7diwt3, project-oo7diwt3-production'
    },
    statusCode: 409,
    statusMessage: 'Conflict'
  },
  statusCode: 409,
  responseBody: '{\n' +
    '  "error": {\n' +
    '    "description": "Mutation failed: Document \\"M5yxdnIFfo2xsqhUyZRVGZ\\" has unexpected revision ID (\\"UBS0CGlpAgCmKl30x8S9mv\\"), expected \\"UBS0CGlpAgCmKl30x8R1zf\\"",\n' +
    '    "items": [\n' +
    '      {\n' +
    '        "error": {\n' +
    '          "currentRevisionID": "UBS0CGlpAgCmKl30x8S9mv",\n' +
    '          "description": "Document \\"M5yxdnIFfo2xsqhUyZRVGZ\\" has unexpected revision ID (\\"UBS0CGlpAgCmKl30x8S9mv\\"), expected \\"UBS0CGlpAgCmKl30x8R1zf\\"",\n' +
    '          "expectedRevisionID": "UBS0CGlpAgCmKl30x8R1zf",\n' +
    '          "type": "documentRevisionIDDoesNotMatchError"\n' +
    '        },\n' +
    '        "index": 0\n' +
    '      }\n' +
    '    ],\n' +
    '    "type": "mutationError"\n' +
    '  }\n' +
    '}',
  details: {
    description: 'Mutation failed: Document "M5yxdnIFfo2xsqhUyZRVGZ" has unexpected revision ID ("UBS0CGlpAgCmKl30x8S9mv"), expected "UBS0CGlpAgCmKl30x8R1zf"',
    items: [ [Object] ],
    type: 'mutationError'
  }
}
 POST /admin/brochures/M5yxdnIFfo2xsqhUyZRVGZ/edit 200 in 526ms (next.js: 13ms, proxy.ts: 22ms, application-code: 491ms)
  └─ ƒ saveBrochureAction("M5yxdnIFfo2xsqhUyZRVGZ", {"accentColor":"#b76c70","customColors":["[Object]","[Object]"],"event":"Italian Grand Prix","...":"8 items not stringified"}, "UBS0CGlpAgCmKl30x8R1zf") in 479ms src/lib/sanity/actions.ts
 POST /admin/brochures/M5yxdnIFfo2xsqhUyZRVGZ/edit 200 in 1871ms (next.js: 23ms, proxy.ts: 17ms, application-code: 1831ms)
  └─ ƒ updateBrochureSettingsAction("M5yxdnIFfo2xsqhUyZRVGZ", {"accentColor":null,"backgroundColor":null,"bodyColor":null,"...":"22 items not stringified"}, "italian-grand-prix") in 1124ms src/lib/sanity/actions.ts
