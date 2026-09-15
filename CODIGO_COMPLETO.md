# Código Azul — Código completo

## .gitignore

````text
node_modules/
.env
.env.*
!.env.example
coverage/
*.log
````

## .env.example

````text
SUPABASE_URL=https://TU_PROYECTO.supabase.co
# Clave secreta de servidor o service_role. Nunca usar en el frontend.
SUPABASE_KEY=TU_CLAVE_SECRETA_DE_SUPABASE
# Generar: node --input-type=module -e "import {randomBytes} from 'node:crypto'; console.log(randomBytes(48).toString('hex'))"
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
# Render: 1. Local: 0.
TRUST_PROXY=0
````

## package.json

````json
{
  "name": "codigo-azul-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24 <25" },
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "node --test"
  },
  "dependencies": {
    "@supabase/supabase-js": "2.116.0",
    "cors": "2.8.6",
    "dotenv": "17.4.2",
    "express": "5.2.1",
    "express-rate-limit": "8.7.0",
    "express-validator": "7.3.2",
    "json2csv": "5.0.7",
    "jsonwebtoken": "9.0.3",
    "pdfkit": "0.20.2",
    "socket.io": "4.8.3"
  },
  "devDependencies": {
    "@electric-sql/pglite": "0.5.8",
    "socket.io-client": "4.8.3",
    "supertest": "7.2.2"
  }
}
````

## package-lock.json

````json
{
  "name": "codigo-azul-backend",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "codigo-azul-backend",
      "version": "1.0.0",
      "dependencies": {
        "@supabase/supabase-js": "2.116.0",
        "cors": "2.8.6",
        "dotenv": "17.4.2",
        "express": "5.2.1",
        "express-rate-limit": "8.7.0",
        "express-validator": "7.3.2",
        "json2csv": "5.0.7",
        "jsonwebtoken": "9.0.3",
        "pdfkit": "0.20.2",
        "socket.io": "4.8.3"
      },
      "devDependencies": {
        "@electric-sql/pglite": "0.5.8",
        "socket.io-client": "4.8.3",
        "supertest": "7.2.2"
      },
      "engines": {
        "node": ">=24 <25"
      }
    },
    "node_modules/@electric-sql/pglite": {
      "version": "0.5.8",
      "resolved": "https://registry.npmjs.org/@electric-sql/pglite/-/pglite-0.5.8.tgz",
      "integrity": "sha512-n9tsbUOhwx2epK1V0ZG9Ar4SHWUju04dhmzZXiSBXwBoleOvIfals33NAaWgagQVAL4Rbvx/Ptsu3P+pA09f6Q==",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/@noble/ciphers": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@noble/ciphers/-/ciphers-1.3.0.tgz",
      "integrity": "sha512-2I0gnIVPtfnMw9ee9h1dJG7tp81+8Ob3OJb3Mv37rx5L40/b0i7djjCVvGOVqc9AEIQyvyu1i6ypKdFw8R8gQw==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@noble/hashes": {
      "version": "1.8.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.8.0.tgz",
      "integrity": "sha512-jCs9ldd7NwzpgXDIf6P3+NrHh9/sD6CQdxHyjQI+h/6rDNo88ypBxxz45UDuZHz9r3tNz7N/VInSVoVdtXEI4A==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@paralleldrive/cuid2": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/@paralleldrive/cuid2/-/cuid2-2.3.1.tgz",
      "integrity": "sha512-XO7cAxhnTZl0Yggq6jOgjiOHhbgcO4NqFqwSmQpjK3b6TEE6Uj/jfSk6wzYyemh3+I0sHirKSetjQwn5cZktFw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "^1.1.5"
      }
    },
    "node_modules/@socket.io/component-emitter": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@socket.io/component-emitter/-/component-emitter-3.1.2.tgz",
      "integrity": "sha512-9BCxFwvbGg/RsZK9tjXd8s4UcwR0MWeFQ1XEKIQVVvAGJyINdrqKMcTRyLoK8Rse1GjzLV9cwjWV1olXRWEXVA==",
      "license": "MIT"
    },
    "node_modules/@supabase/auth-js": {
      "version": "2.116.0",
      "resolved": "https://registry.npmjs.org/@supabase/auth-js/-/auth-js-2.116.0.tgz",
      "integrity": "sha512-Cmosty12gyKGK9N3bQb+lMmuAFev5nmUzaR1AsmZHqKOAGzqX1VQzmp49CNPwOx/pw0H9Qqk4rs9yhwTlKpfDg==",
      "license": "MIT",
      "dependencies": {
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/functions-js": {
      "version": "2.116.0",
      "resolved": "https://registry.npmjs.org/@supabase/functions-js/-/functions-js-2.116.0.tgz",
      "integrity": "sha512-E+VOc2QDcni/fySqkBFiZhnoB3SGydEdZgFI6/dEAGAHx6yEhB46TN9qb2wXs+E+RSzOBV0R6dasiSlw4xlZAA==",
      "license": "MIT",
      "dependencies": {
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/phoenix": {
      "version": "0.4.5",
      "resolved": "https://registry.npmjs.org/@supabase/phoenix/-/phoenix-0.4.5.tgz",
      "integrity": "sha512-aAn9H9ovVyeApKy11OWOrrOGq8DV68yWeH4ud2lN9fzn4aO8Zb5GLL9m1pUg9nLqIcT+ZDfAcsZe0E/nqdv2lw==",
      "license": "MIT"
    },
    "node_modules/@supabase/postgrest-js": {
      "version": "2.116.0",
      "resolved": "https://registry.npmjs.org/@supabase/postgrest-js/-/postgrest-js-2.116.0.tgz",
      "integrity": "sha512-kGpVZTDHxFTJS3tu+rU0iTAZ+4U0bcLVjxwCk8f3gRhjw3qdCZjTBlgYvc4kGH2XccmAzbkKwXL/mrNHMGSc+A==",
      "license": "MIT",
      "dependencies": {
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/realtime-js": {
      "version": "2.116.0",
      "resolved": "https://registry.npmjs.org/@supabase/realtime-js/-/realtime-js-2.116.0.tgz",
      "integrity": "sha512-MHAnlXxi2s6yiJsZsQMfs2B3RFxeVfQWxerqYhIMqcCQV/FuY3LIeouPEkXw/ah7wUWMLYwempF9MOCUScyddg==",
      "license": "MIT",
      "dependencies": {
        "@supabase/phoenix": "0.4.5",
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/storage-js": {
      "version": "2.116.0",
      "resolved": "https://registry.npmjs.org/@supabase/storage-js/-/storage-js-2.116.0.tgz",
      "integrity": "sha512-6/3hR6vccBP6oGM5B6RfbwZcTCKmQOodd/ZWQdsw8yJsU5zO/a//oBL6yLnmgxcjnHSrelW8rsO7hL5DPybyUQ==",
      "license": "MIT",
      "dependencies": {
        "iceberg-js": "^0.8.1",
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/supabase-js": {
      "version": "2.116.0",
      "resolved": "https://registry.npmjs.org/@supabase/supabase-js/-/supabase-js-2.116.0.tgz",
      "integrity": "sha512-YyWmKXt2NspV9iO8FPnlswUFJIRnrLd3oTCb+3ZyYRuKZtBH0xCUDgnUqoyA0fGUxpM/UhfwDjYf/dht/9bp7g==",
      "license": "MIT",
      "dependencies": {
        "@supabase/auth-js": "2.116.0",
        "@supabase/functions-js": "2.116.0",
        "@supabase/postgrest-js": "2.116.0",
        "@supabase/realtime-js": "2.116.0",
        "@supabase/storage-js": "2.116.0"
      },
      "engines": {
        "node": ">=22.0.0"
      },
      "peerDependencies": {
        "@opentelemetry/api": ">=1.0.0"
      },
      "peerDependenciesMeta": {
        "@opentelemetry/api": {
          "optional": true
        }
      }
    },
    "node_modules/@swc/helpers": {
      "version": "0.5.23",
      "resolved": "https://registry.npmjs.org/@swc/helpers/-/helpers-0.5.23.tgz",
      "integrity": "sha512-5lSsMOTXURePglDfvuAQUqkGek9Hg2kksOYay2m0+XR++b2NWYL/4sWyuvVBIs8oKnJaxkdi9whaL/sqN13afw==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.8.0"
      }
    },
    "node_modules/@types/cors": {
      "version": "2.8.19",
      "resolved": "https://registry.npmjs.org/@types/cors/-/cors-2.8.19.tgz",
      "integrity": "sha512-mFNylyeyqN93lfe/9CSxOGREz8cpzAhH+E93xJ4xWQf62V8sQ/24reV2nyzUWM6H6Xji+GGHpkbLe7pVoUEskg==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/node": {
      "version": "26.5.1",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-26.5.1.tgz",
      "integrity": "sha512-CzNm2FezW4VR/LjG6yUdiEgLE/rAQ9Slj5gCu/C2VrdcW7I0ahNZ8DRbHT7zOZ6r3ONgd/bsQIeSaoDGrd1C6g==",
      "license": "MIT",
      "dependencies": {
        "undici-types": "~8.9.0"
      }
    },
    "node_modules/@types/ws": {
      "version": "8.18.1",
      "resolved": "https://registry.npmjs.org/@types/ws/-/ws-8.18.1.tgz",
      "integrity": "sha512-ThVF6DCVhA8kUGy+aazFQ4kXQ7E1Ty7A3ypFOe0IcJV8O/M511G99AW24irKrW56Wt44yG9+ij8FaqoBGkuBXg==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/accepts": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-2.0.0.tgz",
      "integrity": "sha512-5cvg6CtKwfgdmVqY1WIiXKc3Q1bkRqGLi+2W/6ao+6Y7gu/RCwRuAhGEzh5B4KlszSuTLgZYuqFqo5bImjNKng==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "^3.0.0",
        "negotiator": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/asap": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/asap/-/asap-2.0.6.tgz",
      "integrity": "sha512-BSHWgDSAiKs50o2Re8ppvp3seVHXSRM44cdSsT9FfNEUUZLOGWVCsiWaRPWM1Znn+mqZ1OfVZ3z3DWEzSp7hRA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/base64id": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/base64id/-/base64id-2.0.0.tgz",
      "integrity": "sha512-lGe34o6EHj9y3Kts9R4ZYs/Gr+6N7MCaMlIFA3F1R2O5/m7K06AxfSeO5530PEERE6/WyEg3lsuyw4GHlPZHog==",
      "license": "MIT",
      "engines": {
        "node": "^4.5.0 || >= 5.9"
      }
    },
    "node_modules/body-parser": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-2.3.0.tgz",
      "integrity": "sha512-2cGmJupaNgg+QUwVLAucDuWuoMZ6EX9iHDRswZ5lsNYEmwPaRknMPCLZz07yTzVq/83p4o/wzbDZbBrTvGGTIw==",
      "license": "MIT",
      "dependencies": {
        "bytes": "^3.1.2",
        "content-type": "^2.0.0",
        "debug": "^4.4.3",
        "http-errors": "^2.0.1",
        "iconv-lite": "^0.7.2",
        "on-finished": "^2.4.1",
        "qs": "^6.15.2",
        "raw-body": "^3.0.2",
        "type-is": "^2.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/body-parser/node_modules/content-type": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.1.0.tgz",
      "integrity": "sha512-mj7UPXE0jaqaOsukNZRUEfEi2AcL7C/vwmwcHV0O97eO1E1pxBZuyjlZrx5seTaNBg1U6+o35wpa35Qfcc+7ag==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/brotli": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/brotli/-/brotli-1.3.3.tgz",
      "integrity": "sha512-oTKjJdShmDuGW94SyyaoQvAjf30dZaHnjJ8uAF+u2/vGJkJbJPJAT1gDiOJP5v1Zb6f9KEyW/1HpuaWIXtGHPg==",
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.1.2"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/bytes": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/clone": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/clone/-/clone-2.1.2.tgz",
      "integrity": "sha512-3Pe/CF1Nn94hyhIYpjtiLhdCoEoz0DqQ+988E9gmeEdQZlojxnOb74wctFyuwWQHzqyf9X7C7MG8juUpqBJT8w==",
      "license": "MIT",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/commander": {
      "version": "6.2.1",
      "resolved": "https://registry.npmjs.org/commander/-/commander-6.2.1.tgz",
      "integrity": "sha512-U7VdrJFnJgo4xjrHpTzu0yrHPGImdsmD95ZlgYSEajAn2JKzDhDTPG9kBTefmObL2w/ngeZnilk+OV9CG3d7UA==",
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/component-emitter": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/component-emitter/-/component-emitter-1.3.1.tgz",
      "integrity": "sha512-T0+barUSQRTUQASh8bx02dl+DhF54GtIDY13Y3m9oWTklKbb3Wv974meRpeZ3lp1JpLVECWWNHC4vaG2XHXouQ==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/content-disposition": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-1.1.0.tgz",
      "integrity": "sha512-5jRCH9Z/+DRP7rkvY83B+yGIGX96OYdJmzngqnw2SBSxqCFPd0w2km3s5iawpGX8krnwSGmF0FW5Nhr0Hfai3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/content-type": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie-signature": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.2.2.tgz",
      "integrity": "sha512-D76uU73ulSXrD1UXF4KE2TMxVVwhsnCgfAyTg9k8P6KGZjlXKrOLe4dJQKI3Bxi5wjesZoFXJWElNWBjPZMbhg==",
      "license": "MIT",
      "engines": {
        "node": ">=6.6.0"
      }
    },
    "node_modules/cookiejar": {
      "version": "2.1.4",
      "resolved": "https://registry.npmjs.org/cookiejar/-/cookiejar-2.1.4.tgz",
      "integrity": "sha512-LDx6oHrK+PhzLKJU9j5S7/Y3jM/mUHvD/DeI1WQmJn652iPC5Y4TBzC9l+5OMOXlyTTA+SmVUPm0HQUwpD5Jqw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cors": {
      "version": "2.8.6",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.6.tgz",
      "integrity": "sha512-tJtZBBHA6vjIAaF6EnIaq6laBBP9aq/Y3ouVJjEfoHbRBcHBAHYcMh/w8LDrk2PvIMMq8gmopa5D4V8RmbrxGw==",
      "license": "MIT",
      "dependencies": {
        "object-assign": "^4",
        "vary": "^1"
      },
      "engines": {
        "node": ">= 0.10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/depd": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/dezalgo": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/dezalgo/-/dezalgo-1.0.4.tgz",
      "integrity": "sha512-rXSP0bf+5n0Qonsb+SVVfNfIsimO4HEtmnIpPHY8Q1UCzKlQrDMfdobr8nJOOsRgWCyMRqeSBQzmWUMq7zvVig==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "asap": "^2.0.0",
        "wrappy": "1"
      }
    },
    "node_modules/dfa": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/dfa/-/dfa-1.2.0.tgz",
      "integrity": "sha512-ED3jP8saaweFTjeGX8HQPjeC1YYyZs98jGNZx6IiBvxW7JG5v492kamAQB3m2wop07CvU/RQmzcKr6bgcC5D/Q==",
      "license": "MIT"
    },
    "node_modules/dotenv": {
      "version": "17.4.2",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-17.4.2.tgz",
      "integrity": "sha512-nI4U3TottKAcAD9LLud4Cb7b2QztQMUEfHbvhTH09bqXTxnSie8WnjPALV/WMCrJZ6UV/qHJ6L03OqO3LcdYZw==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow==",
      "license": "MIT"
    },
    "node_modules/encodeurl": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/engine.io": {
      "version": "6.6.10",
      "resolved": "https://registry.npmjs.org/engine.io/-/engine.io-6.6.10.tgz",
      "integrity": "sha512-9/lX2bdlizlCXMHRMOIm03VBQHQYC7VvydcxtTAUJRxNW1QzM/2PMFSmr6h/lCiMHcyCP6abK+t9Q+j4vekk8Q==",
      "license": "MIT",
      "dependencies": {
        "@types/cors": "^2.8.12",
        "@types/node": ">=10.0.0",
        "@types/ws": "^8.5.12",
        "accepts": "~1.3.4",
        "cookie": "~0.7.2",
        "cors": "~2.8.5",
        "debug": "~4.4.1",
        "engine.io-parser": "~5.2.1",
        "ws": "~8.21.0"
      },
      "engines": {
        "node": ">=10.2.0"
      }
    },
    "node_modules/engine.io-client": {
      "version": "6.6.6",
      "resolved": "https://registry.npmjs.org/engine.io-client/-/engine.io-client-6.6.6.tgz",
      "integrity": "sha512-iY6QdftLQ9pyiPoX082bpf/u1UewnOaJrtJIF9T0++QB34lZrj0uP+Q/bj8AlUsAxqhnkTV2BS8SBZSxOmoV5Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@socket.io/component-emitter": "~3.1.0",
        "debug": "~4.4.1",
        "engine.io-parser": "~5.2.1",
        "ws": "~8.21.0",
        "xmlhttprequest-ssl": "~2.1.1"
      }
    },
    "node_modules/engine.io-parser": {
      "version": "5.2.3",
      "resolved": "https://registry.npmjs.org/engine.io-parser/-/engine.io-parser-5.2.3.tgz",
      "integrity": "sha512-HqD3yTBfnBxIrbnM1DoD6Pcq8NECnh8d4As1Qgh0z5Gg3jRRIqijury0CL3ghu/edArpUYiYqQiDUQBIs4np3Q==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/engine.io/node_modules/accepts": {
      "version": "1.3.8",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-1.3.8.tgz",
      "integrity": "sha512-PYAthTa2m2VKxuvSD3DPC/Gy+U+sOA1LAuT8mkmRuvw+NACSaeXEQ+NHcVF7rONl6qcaxV3Uuemwawk+7+SJLw==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "~2.1.34",
        "negotiator": "0.6.3"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/engine.io/node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/engine.io/node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/engine.io/node_modules/negotiator": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
      "integrity": "sha512-+EUsqGPLsM+j/zdChZjsnX51g4XrHFOIXwfnCVPGlQk/k5giakcKsuxCObBRu6DSm9opw/O6slWbJdghQM4bBg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
      "license": "MIT"
    },
    "node_modules/etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/express": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/express/-/express-5.2.1.tgz",
      "integrity": "sha512-hIS4idWWai69NezIdRt2xFVofaF4j+6INOpJlVOLDO8zXGpUVEVzIYk12UUi2JzjEzWL3IOAxcTubgz9Po0yXw==",
      "license": "MIT",
      "dependencies": {
        "accepts": "^2.0.0",
        "body-parser": "^2.2.1",
        "content-disposition": "^1.0.0",
        "content-type": "^1.0.5",
        "cookie": "^0.7.1",
        "cookie-signature": "^1.2.1",
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "finalhandler": "^2.1.0",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.0",
        "merge-descriptors": "^2.0.0",
        "mime-types": "^3.0.0",
        "on-finished": "^2.4.1",
        "once": "^1.4.0",
        "parseurl": "^1.3.3",
        "proxy-addr": "^2.0.7",
        "qs": "^6.14.0",
        "range-parser": "^1.2.1",
        "router": "^2.2.0",
        "send": "^1.1.0",
        "serve-static": "^2.2.0",
        "statuses": "^2.0.1",
        "type-is": "^2.0.1",
        "vary": "^1.1.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/express-rate-limit": {
      "version": "8.7.0",
      "resolved": "https://registry.npmjs.org/express-rate-limit/-/express-rate-limit-8.7.0.tgz",
      "integrity": "sha512-hOwV7WOxXfjRpAM1DSJWZDXx3GhplwD8IfwuwvogD8i1Qnkgosw/H45s4ZnFAUHDAhPjlY9hLBvJhKmGMyY26g==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.3",
        "ip-address": "^10.2.0"
      },
      "engines": {
        "node": ">= 16"
      },
      "funding": {
        "url": "https://github.com/sponsors/express-rate-limit"
      },
      "peerDependencies": {
        "express": ">= 4.11"
      }
    },
    "node_modules/express-validator": {
      "version": "7.3.2",
      "resolved": "https://registry.npmjs.org/express-validator/-/express-validator-7.3.2.tgz",
      "integrity": "sha512-ctLw1Vl6dXVH62dIQMDdTAQkrh480mkFuG6/SGXOaVlwPNukhRAe7EgJIMJ2TSAni8iwHBRp530zAZE5ZPF2IA==",
      "license": "MIT",
      "dependencies": {
        "lodash": "^4.18.1",
        "validator": "~13.15.23"
      },
      "engines": {
        "node": ">= 8.0.0"
      }
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "license": "MIT"
    },
    "node_modules/fast-safe-stringify": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/fast-safe-stringify/-/fast-safe-stringify-2.1.1.tgz",
      "integrity": "sha512-W+KJc2dmILlPplD/H4K9l9LcAHAfPtP6BY84uVLXQ6Evcz9Lcg33Y2z1IVblT6xdY54PXYVHEv+0Wpq8Io6zkA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fflate": {
      "version": "0.8.3",
      "resolved": "https://registry.npmjs.org/fflate/-/fflate-0.8.3.tgz",
      "integrity": "sha512-tbZNuJrLwGUp3zshBtdy4W+ORxZuIh8a5ilyIEQDC5rY1f3U20JMry0Ll3WBzU58EZKsEuJFXhb5gwv8CsPvgA==",
      "license": "MIT"
    },
    "node_modules/finalhandler": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-2.1.1.tgz",
      "integrity": "sha512-S8KoZgRZN+a5rNwqTxlZZePjT/4cnm0ROV70LedRHZ0p8u9fRID0hJUZQpkKLzro8LfmC8sx23bY6tVNxv8pQA==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "on-finished": "^2.4.1",
        "parseurl": "^1.3.3",
        "statuses": "^2.0.1"
      },
      "engines": {
        "node": ">= 18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/fontkit": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/fontkit/-/fontkit-2.0.4.tgz",
      "integrity": "sha512-syetQadaUEDNdxdugga9CpEYVaQIxOwk7GlwZWWZ19//qW4zE5bknOKeMBDYAASwnpaSHKJITRLMF9m1fp3s6g==",
      "license": "MIT",
      "dependencies": {
        "@swc/helpers": "^0.5.12",
        "brotli": "^1.3.2",
        "clone": "^2.1.2",
        "dfa": "^1.2.0",
        "fast-deep-equal": "^3.1.3",
        "restructure": "^3.0.0",
        "tiny-inflate": "^1.0.3",
        "unicode-properties": "^1.4.0",
        "unicode-trie": "^2.0.0"
      }
    },
    "node_modules/form-data": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.6.tgz",
      "integrity": "sha512-vKatAh4SlVfgbv+YtmhiRjhEMJsYpsG1Y2rMQtR+SVSbytsSD1YGzDIcrAJmdFec88u/+VoGmxnl+80gL1tRCQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "es-set-tostringtag": "^2.1.0",
        "hasown": "^2.0.4",
        "mime-types": "^2.1.35"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/form-data/node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/form-data/node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/formidable": {
      "version": "3.5.4",
      "resolved": "https://registry.npmjs.org/formidable/-/formidable-3.5.4.tgz",
      "integrity": "sha512-YikH+7CUTOtP44ZTnUhR7Ic2UASBPOqmaRkRKxRbywPTe5VxF7RRCck4af9wutiZ/QKM5nME9Bie2fFaPz5Gug==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@paralleldrive/cuid2": "^2.2.2",
        "dezalgo": "^1.0.4",
        "once": "^1.4.0"
      },
      "engines": {
        "node": ">=14.0.0"
      },
      "funding": {
        "url": "https://ko-fi.com/tunnckoCore/commissions"
      }
    },
    "node_modules/forwarded": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fresh": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-2.0.0.tgz",
      "integrity": "sha512-Rx/WycZ60HOaqLKAi6cHRKKI7zxWbJ31MhntmtwMoaTeF7XFH9hhBp8vITaMidfljRQ6eYWCKkaTK+ykVJHP2A==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/http-errors": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
      "integrity": "sha512-4FbRdAX+bSdmo4AUFuS0WNiPz8NgFt+r8ThgNWmlrjQjt1Q7ZR9+zTlce2859x4KSXrwIsaeTqDoKQmtP8pLmQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "~2.0.0",
        "inherits": "~2.0.4",
        "setprototypeof": "~1.2.0",
        "statuses": "~2.0.2",
        "toidentifier": "~1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/iceberg-js": {
      "version": "0.8.1",
      "resolved": "https://registry.npmjs.org/iceberg-js/-/iceberg-js-0.8.1.tgz",
      "integrity": "sha512-1dhVQZXhcHje7798IVM+xoo/1ZdVfzOMIc8/rgVSijRK38EDqOJoGula9N/8ZI5RD8QTxNQtK/Gozpr+qUqRRA==",
      "license": "MIT",
      "engines": {
        "node": ">=20.0.0"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.7.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.7.3.tgz",
      "integrity": "sha512-IKXpvIzjnC9XTAUbVBcMfGS0EPaIXtW6v+zr+RRp+hqULEpo0owZax6wyRwPOJbWbzjYspQwusTsfVr0ifh4uQ==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/ip-address": {
      "version": "10.7.1",
      "resolved": "https://registry.npmjs.org/ip-address/-/ip-address-10.7.1.tgz",
      "integrity": "sha512-4OUAqU9Z1i3vCnS05hzGiFnEMDpQ+62pAD/MVQOp83fYyNC8GleCqaS0QikQBmcWCrKFiUs/B8ztRRiYOAXuCA==",
      "license": "MIT",
      "engines": {
        "node": ">= 12"
      }
    },
    "node_modules/ipaddr.js": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/is-promise": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/is-promise/-/is-promise-4.0.0.tgz",
      "integrity": "sha512-hvpoI6korhJMnej285dSg6nu1+e6uxs7zG3BYAm5byqDsgJNWwxzM6z6iZiAgQR4TJ30JmBTOwqZUw3WlyH3AQ==",
      "license": "MIT"
    },
    "node_modules/json2csv": {
      "version": "5.0.7",
      "resolved": "https://registry.npmjs.org/json2csv/-/json2csv-5.0.7.tgz",
      "integrity": "sha512-YRZbUnyaJZLZUJSRi2G/MqahCyRv9n/ds+4oIetjDF3jWQA7AG7iSeKTiZiCNqtMZM7HDyt0e/W6lEnoGEmMGA==",
      "deprecated": "Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.",
      "license": "MIT",
      "dependencies": {
        "commander": "^6.1.0",
        "jsonparse": "^1.3.1",
        "lodash.get": "^4.4.2"
      },
      "bin": {
        "json2csv": "bin/json2csv.js"
      },
      "engines": {
        "node": ">= 10",
        "npm": ">= 6.13.0"
      }
    },
    "node_modules/jsonparse": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/jsonparse/-/jsonparse-1.3.1.tgz",
      "integrity": "sha512-POQXvpdL69+CluYsillJ7SUhKvytYjW9vG/GKpnf+xP8UWgYEM/RaMzHHofbALDiKbbP1W8UEYmgGl39WkPZsg==",
      "engines": [
        "node >= 0.2.0"
      ],
      "license": "MIT"
    },
    "node_modules/jsonwebtoken": {
      "version": "9.0.3",
      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.3.tgz",
      "integrity": "sha512-MT/xP0CrubFRNLNKvxJ2BYfy53Zkm++5bX9dtuPbqAeQpTVe0MQTFhao8+Cp//EmJp244xt6Drw/GVEGCUj40g==",
      "license": "MIT",
      "dependencies": {
        "jws": "^4.0.1",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=12",
        "npm": ">=6"
      }
    },
    "node_modules/jwa": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-2.0.1.tgz",
      "integrity": "sha512-hRF04fqJIP8Abbkq5NKGN0Bbr3JxlQ+qhZufXVr0DvujKy93ZCbXZMHDL4EOtodSbCWxOqR8MS1tXA5hwqCXDg==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/jws/-/jws-4.0.1.tgz",
      "integrity": "sha512-EKI/M/yqPncGUUh44xz0PxSidXFr/+r0pA70+gIYhjv+et7yxM+s29Y+VGDkovRofQem0fs7Uvf4+YmAdyRduA==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^2.0.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/linebreak": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/linebreak/-/linebreak-1.1.0.tgz",
      "integrity": "sha512-MHp03UImeVhB7XZtjd0E4n6+3xr5Dq/9xI/5FptGk5FrbDR3zagPa2DS6U8ks/3HjbKWG9Q1M2ufOzxV2qLYSQ==",
      "license": "MIT",
      "dependencies": {
        "base64-js": "0.0.8",
        "unicode-trie": "^2.0.0"
      }
    },
    "node_modules/linebreak/node_modules/base64-js": {
      "version": "0.0.8",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-0.0.8.tgz",
      "integrity": "sha512-3XSA2cR/h/73EzlXXdU6YNycmYI7+kicTxks4eJg2g39biHR84slg2+des+p7iHYhbRg/udIS4TD53WabcOUkw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/lodash": {
      "version": "4.18.1",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.18.1.tgz",
      "integrity": "sha512-dMInicTPVE8d1e5otfwmmjlxkZoUpiVLwyeTdUsi/Caj/gfzzblBcCE5sRHV/AsjuCmxWrte2TNGSYuCeCq+0Q==",
      "license": "MIT"
    },
    "node_modules/lodash.get": {
      "version": "4.4.2",
      "resolved": "https://registry.npmjs.org/lodash.get/-/lodash.get-4.4.2.tgz",
      "integrity": "sha512-z+Uw/vLuy6gQe8cfaFWD7p0wVv8fJl3mbzXh33RS+0oW2wvUqiRXiQ69gLWSLpgB5/6sU+r6BlQR0MBILadqTQ==",
      "deprecated": "This package is deprecated. Use the optional chaining (?.) operator instead.",
      "license": "MIT"
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/media-typer": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-1.1.1.tgz",
      "integrity": "sha512-yz3xRaG20c6/BOzvYoDaGtPmGscs7YivItZEEqe6GbwNfHuxu9YNmvnEkMzKldAGY4/80pRcQRZSEnhquk9XuQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/merge-descriptors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-2.0.0.tgz",
      "integrity": "sha512-Snk314V5ayFLhp3fkUREub6WtjBfPdCPY1Ln8/8munuLuiYhsABgBVWsozAG+MWMbVEvcdcpbi9R7ww22l9Q3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/methods": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/methods/-/methods-1.1.2.tgz",
      "integrity": "sha512-iclAHeNqNm68zFtnZ0e+1L2yUIdvzNoauKU4WBA3VvH/vPFieF7qfRlwUZU+DA9P9bPXIS90ulxoUoCH23sV2w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/mime/-/mime-2.6.0.tgz",
      "integrity": "sha512-USPkMeET31rOMiarsBNIHZKLGgvKc/LrjofAnBlOttf5ajRvqiRA8QsenbcooctK6d6Ts6aqZXBA+XbkKthiQg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "mime": "cli.js"
      },
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/mime-db": {
      "version": "1.54.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.54.0.tgz",
      "integrity": "sha512-aU5EJuIN2WDemCcAp2vFBfp/m4EAhWJnUNSSw0ixs7/kXbd6Pg64EmwJkNdFhB8aWt1sH2CTXrLxo/iAGV3oPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-3.0.2.tgz",
      "integrity": "sha512-Lbgzdk0h4juoQ9fCKXW4by0UJqj+nOOrI9MJ1sSj4nI8aI2eo1qmvQEie4VD1glsS250n15LsWsYtCugiStS5A==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "^1.54.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/negotiator": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-1.1.0.tgz",
      "integrity": "sha512-NMPBRMJgiQHjbd8phG3Vebdx4kZ1H121rbl5IkMqeOsahptB9BKo/d7oJ3zTXqTgagn2bWlNSXkh0QUGM31RYg==",
      "license": "MIT",
      "dependencies": {
        "content-type": "^2.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/negotiator/node_modules/content-type": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.1.0.tgz",
      "integrity": "sha512-mj7UPXE0jaqaOsukNZRUEfEi2AcL7C/vwmwcHV0O97eO1E1pxBZuyjlZrx5seTaNBg1U6+o35wpa35Qfcc+7ag==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/on-finished": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
      "integrity": "sha512-oVlzkg3ENAhCk2zdv7IJwd/QUD4z2RxRwpkcGY8psCVcCYZNq4wYnVWALHM+brtuJjePWiYF/ClmuDr8Ch5+kg==",
      "license": "MIT",
      "dependencies": {
        "ee-first": "1.1.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/pako": {
      "version": "0.2.9",
      "resolved": "https://registry.npmjs.org/pako/-/pako-0.2.9.tgz",
      "integrity": "sha512-NUcwaKxUxWrZLpDG+z/xZaCgQITkA/Dv4V/T6bw7VON6l1Xz/VnrBqrYjZQ12TamKHzITTfOEIYUj48y2KXImA==",
      "license": "MIT"
    },
    "node_modules/parseurl": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/path-to-regexp": {
      "version": "8.4.2",
      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-8.4.2.tgz",
      "integrity": "sha512-qRcuIdP69NPm4qbACK+aDogI5CBDMi1jKe0ry5rSQJz8JVLsC7jV8XpiJjGRLLol3N+R5ihGYcrPLTno6pAdBA==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/pdfkit": {
      "version": "0.20.2",
      "resolved": "https://registry.npmjs.org/pdfkit/-/pdfkit-0.20.2.tgz",
      "integrity": "sha512-Q/w03ICAQyXfHNfTsg1udp0ADerdBN0s7a6XSPL7J7Ro6ABnafoBOCDBstIO9U02mvzHEV8HrvFIw5iV5ejIRA==",
      "license": "MIT",
      "dependencies": {
        "@noble/ciphers": "^1.3.0",
        "@noble/hashes": "^1.8.0",
        "fflate": "^0.8.3",
        "fontkit": "^2.0.4",
        "linebreak": "^1.1.0",
        "png-js": "^2.0.0"
      }
    },
    "node_modules/png-js": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/png-js/-/png-js-2.0.0.tgz",
      "integrity": "sha512-GdzJuUMc6ZSpxFJWVxtOH1bzYHym+TOnveqUjb+VJIbZWbZzyiRGFiKhbiielfpYbgMlhHVhsJ0FTazfuRFkMA==",
      "dependencies": {
        "fflate": "^0.8.2"
      }
    },
    "node_modules/proxy-addr": {
      "version": "2.0.8",
      "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.8.tgz",
      "integrity": "sha512-5nnx0yGyVUcY6t9RnWcARWtwT9F1D8O9rt08htPvnd49W1IgZtmLkhu9WfMzQj1cFxjHIO6connUNVW5k7AVyQ==",
      "license": "MIT",
      "dependencies": {
        "forwarded": "0.2.0",
        "ipaddr.js": "1.9.1"
      },
      "engines": {
        "node": ">= 0.10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/qs": {
      "version": "6.16.0",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.16.0.tgz",
      "integrity": "sha512-h6fhOIaRrID2CbEY2fqs+7t+UXZo+MLAnU5gRIq85uFtdiUPCdsApMlHhXogKVM4HM2DVbIjGNTTYH2OcmP1vA==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "es-define-property": "^1.0.1",
        "side-channel": "^1.1.1"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/range-parser": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.3.0.tgz",
      "integrity": "sha512-hek2mFQpPuI4E1BBKrSto+BU3e3x4xuarsbiwr3+lf7p44juvFMV0XFWQAP3xUyqXA4RrXLIoaSUGbSt056ZMw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/raw-body": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-3.0.2.tgz",
      "integrity": "sha512-K5zQjDllxWkf7Z5xJdV0/B0WTNqx6vxG70zJE4N0kBs4LovmEYWJzQGxC9bS9RAKu3bgM40lrd5zoLJ12MQ5BA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.7.0",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/restructure": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/restructure/-/restructure-3.0.2.tgz",
      "integrity": "sha512-gSfoiOEA0VPE6Tukkrr7I0RBdE0s7H1eFCDBk05l1KIQT1UIKNc5JZy6jdyW6eYH3aR3g5b3PuL77rq0hvwtAw==",
      "license": "MIT"
    },
    "node_modules/router": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/router/-/router-2.2.0.tgz",
      "integrity": "sha512-nLTrUKm2UyiL7rlhapu/Zl45FwNgkZGaCpZbIHajDYgwlJCOzLSk+cIPAnsEqV955GjILJnKbdQC1nVPz+gAYQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "is-promise": "^4.0.0",
        "parseurl": "^1.3.3",
        "path-to-regexp": "^8.0.0"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/send": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/send/-/send-1.2.1.tgz",
      "integrity": "sha512-1gnZf7DFcoIcajTjTwjwuDjzuz4PPcY2StKPlsGAQ1+YH20IRVrBaXSWmdjowTJ6u8Rc01PoYOGHXfP1mYcZNQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.3",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.1",
        "mime-types": "^3.0.2",
        "ms": "^2.1.3",
        "on-finished": "^2.4.1",
        "range-parser": "^1.2.1",
        "statuses": "^2.0.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/serve-static": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-2.2.1.tgz",
      "integrity": "sha512-xRXBn0pPqQTVQiC8wyQrKs2MOlX24zQ0POGaj0kultvoOCstBQM5yvOhAVSUwOMjQtTvsPWoNCHfPGwaaQJhTw==",
      "license": "MIT",
      "dependencies": {
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "parseurl": "^1.3.3",
        "send": "^1.2.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/setprototypeof": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw==",
      "license": "ISC"
    },
    "node_modules/side-channel": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
      "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4",
        "side-channel-list": "^1.0.1",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/socket.io": {
      "version": "4.8.3",
      "resolved": "https://registry.npmjs.org/socket.io/-/socket.io-4.8.3.tgz",
      "integrity": "sha512-2Dd78bqzzjE6KPkD5fHZmDAKRNe3J15q+YHDrIsy9WEkqttc7GY+kT9OBLSMaPbQaEd0x1BjcmtMtXkfpc+T5A==",
      "license": "MIT",
      "dependencies": {
        "accepts": "~1.3.4",
        "base64id": "~2.0.0",
        "cors": "~2.8.5",
        "debug": "~4.4.1",
        "engine.io": "~6.6.0",
        "socket.io-adapter": "~2.5.2",
        "socket.io-parser": "~4.2.4"
      },
      "engines": {
        "node": ">=10.2.0"
      }
    },
    "node_modules/socket.io-adapter": {
      "version": "2.5.8",
      "resolved": "https://registry.npmjs.org/socket.io-adapter/-/socket.io-adapter-2.5.8.tgz",
      "integrity": "sha512-6Oy52pbg+kvdCVvjcN+FnY7BvxZ7cIHNScbvztT/It5d0vbwoJoVZmF2gjJmnV0/4WlXRfG15zc45ySk9Ah8bw==",
      "license": "MIT",
      "dependencies": {
        "debug": "~4.4.1",
        "ws": "~8.21.0"
      }
    },
    "node_modules/socket.io-client": {
      "version": "4.8.3",
      "resolved": "https://registry.npmjs.org/socket.io-client/-/socket.io-client-4.8.3.tgz",
      "integrity": "sha512-uP0bpjWrjQmUt5DTHq9RuoCBdFJF10cdX9X+a368j/Ft0wmaVgxlrjvK3kjvgCODOMMOz9lcaRzxmso0bTWZ/g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@socket.io/component-emitter": "~3.1.0",
        "debug": "~4.4.1",
        "engine.io-client": "~6.6.1",
        "socket.io-parser": "~4.2.4"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/socket.io-parser": {
      "version": "4.2.7",
      "resolved": "https://registry.npmjs.org/socket.io-parser/-/socket.io-parser-4.2.7.tgz",
      "integrity": "sha512-IH/iSeO9T6gz1KkFleGDWkG9N3dl4jXVYUtMhIqH10Md0ttMer8nUNWiP1DKuNrybD2xBrixLJdCC9J6ECoYkg==",
      "license": "MIT",
      "dependencies": {
        "@socket.io/component-emitter": "~3.1.0",
        "debug": "~4.4.1"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/socket.io/node_modules/accepts": {
      "version": "1.3.8",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-1.3.8.tgz",
      "integrity": "sha512-PYAthTa2m2VKxuvSD3DPC/Gy+U+sOA1LAuT8mkmRuvw+NACSaeXEQ+NHcVF7rONl6qcaxV3Uuemwawk+7+SJLw==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "~2.1.34",
        "negotiator": "0.6.3"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/socket.io/node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/socket.io/node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/socket.io/node_modules/negotiator": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
      "integrity": "sha512-+EUsqGPLsM+j/zdChZjsnX51g4XrHFOIXwfnCVPGlQk/k5giakcKsuxCObBRu6DSm9opw/O6slWbJdghQM4bBg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/statuses": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/superagent": {
      "version": "10.3.0",
      "resolved": "https://registry.npmjs.org/superagent/-/superagent-10.3.0.tgz",
      "integrity": "sha512-B+4Ik7ROgVKrQsXTV0Jwp2u+PXYLSlqtDAhYnkkD+zn3yg8s/zjA2MeGayPoY/KICrbitwneDHrjSotxKL+0XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "component-emitter": "^1.3.1",
        "cookiejar": "^2.1.4",
        "debug": "^4.3.7",
        "fast-safe-stringify": "^2.1.1",
        "form-data": "^4.0.5",
        "formidable": "^3.5.4",
        "methods": "^1.1.2",
        "mime": "2.6.0",
        "qs": "^6.14.1"
      },
      "engines": {
        "node": ">=14.18.0"
      }
    },
    "node_modules/supertest": {
      "version": "7.2.2",
      "resolved": "https://registry.npmjs.org/supertest/-/supertest-7.2.2.tgz",
      "integrity": "sha512-oK8WG9diS3DlhdUkcFn4tkNIiIbBx9lI2ClF8K+b2/m8Eyv47LSawxUzZQSNKUrVb2KsqeTDCcjAAVPYaSLVTA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cookie-signature": "^1.2.2",
        "methods": "^1.1.2",
        "superagent": "^10.3.0"
      },
      "engines": {
        "node": ">=14.18.0"
      }
    },
    "node_modules/tiny-inflate": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/tiny-inflate/-/tiny-inflate-1.0.3.tgz",
      "integrity": "sha512-pkY1fj1cKHb2seWDy0B16HeWyczlJA9/WW3u3c4z/NiWDsO3DOU5D7nhTLE9CF0yXv/QZFY7sEJmj24dK+Rrqw==",
      "license": "MIT"
    },
    "node_modules/toidentifier": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/type-is": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-2.1.0.tgz",
      "integrity": "sha512-faYHw0anBbc/kWF3zFTEnxSFOAGUX9GFbOBthvDdLsIlEoWOFOtS0zgCiQYwIskL9iGXZL3kAXD8OoZ4GmMATA==",
      "license": "MIT",
      "dependencies": {
        "content-type": "^2.0.0",
        "media-typer": "^1.1.0",
        "mime-types": "^3.0.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/type-is/node_modules/content-type": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.1.0.tgz",
      "integrity": "sha512-mj7UPXE0jaqaOsukNZRUEfEi2AcL7C/vwmwcHV0O97eO1E1pxBZuyjlZrx5seTaNBg1U6+o35wpa35Qfcc+7ag==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/undici-types": {
      "version": "8.9.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-8.9.0.tgz",
      "integrity": "sha512-KTDyRTYX8sWmKXAikPHHSyc63CRPETMctyjKFupcC6OBLXT3xsN0e9aF7m+mIXutFWpUXuedtowG7iLOzp0kQg==",
      "license": "MIT"
    },
    "node_modules/unicode-properties": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/unicode-properties/-/unicode-properties-1.4.1.tgz",
      "integrity": "sha512-CLjCCLQ6UuMxWnbIylkisbRj31qxHPAurvena/0iwSVbQ2G1VY5/HjV0IRabOEbDHlzZlRdCrD4NhB0JtU40Pg==",
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.3.0",
        "unicode-trie": "^2.0.0"
      }
    },
    "node_modules/unicode-trie": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-trie/-/unicode-trie-2.0.0.tgz",
      "integrity": "sha512-x7bc76x0bm4prf1VLg79uhAzKw8DVboClSN5VxJuQ+LKDOVEW9CdH+VY7SP+vX7xCYQqzzgQpFqz15zeLvAtZQ==",
      "license": "MIT",
      "dependencies": {
        "pako": "^0.2.5",
        "tiny-inflate": "^1.0.0"
      }
    },
    "node_modules/unpipe": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/validator": {
      "version": "13.15.35",
      "resolved": "https://registry.npmjs.org/validator/-/validator-13.15.35.tgz",
      "integrity": "sha512-TQ5pAGhd5whStmqWvYF4OjQROlmv9SMFVt37qoCBdqRffuuklWYQlCNnEs2ZaIBD1kZRNnikiZOS1eqgkar0iw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/vary": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC"
    },
    "node_modules/ws": {
      "version": "8.21.3",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.21.3.tgz",
      "integrity": "sha512-201TZ/kPWxoPr/OKWjquZR1SWKXcvxdH+e1xrx89b3YbmzLMFCLfnaG1HFIgWzJOEWZ7MvpK++odZufgYR50Rw==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/xmlhttprequest-ssl": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/xmlhttprequest-ssl/-/xmlhttprequest-ssl-2.1.2.tgz",
      "integrity": "sha512-TEU+nJVUUnA4CYJFLvK5X9AOeH4KvDvhIfm0vV1GaQRtchnG0hgK5p8hw/xjv8cunWYCsiPCSDzObPyhEwq3KQ==",
      "dev": true,
      "engines": {
        "node": ">=0.4.0"
      }
    }
  }
}
````

## src/config/env.js

````javascript
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export function readEnv(source = process.env) {
  for (const key of ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET', 'FRONTEND_URL']) {
    if (!source[key]?.trim()) throw new Error(`Falta la variable ${key}`);
  }
  const url = new URL(source.SUPABASE_URL);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('SUPABASE_URL inválida');
  if (source.JWT_SECRET.length < 32 || source.JWT_SECRET.startsWith('REEMPLAZAR')) {
    throw new Error('JWT_SECRET debe ser aleatorio y tener al menos 32 caracteres');
  }
  const origins = source.FRONTEND_URL.split(',').map(value => new URL(value.trim()).origin);
  const port = Number(source.PORT || 3000);
  const trustProxy = Number(source.TRUST_PROXY || 0);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválido');
  if (![0, 1].includes(trustProxy)) throw new Error('TRUST_PROXY debe ser 0 o 1');
  return {
    supabaseUrl: url.href, supabaseKey: source.SUPABASE_KEY,
    jwtSecret: source.JWT_SECRET, origins, port, trustProxy
  };
}
````

## src/config/supabase.js

````javascript
import { createClient } from '@supabase/supabase-js';

export function createSupabase(env) {
  const newClient = () => createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return { db: newClient(), newAuthClient: newClient };
}
````

## src/utils/errors.js

````javascript
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function dbResult({ data, error }) {
  if (error) {
    const errors = {
      '23505': [409, 'El registro ya existe o la cama está ocupada'],
      '23503': [409, 'Referencia inexistente o registro utilizado por otros datos'],
      '23001': [409, 'El registro está utilizado por otros datos'],
      '23514': [400, 'Los datos incumplen una restricción'],
      '22P02': [400, 'Formato de datos inválido'],
      PGRST116: [404, 'Registro no encontrado'],
      PT400: [400, error.message], PT404: [404, error.message], PT409: [409, error.message]
    };
    const mapped = errors[error.code];
    if (mapped) throw new AppError(...mapped);
    console.error('Error de base de datos', { code: error.code });
    throw new AppError(503, 'Base de datos no disponible');
  }
  return data;
}
````

## src/utils/queries.js

````javascript
import { AppError, dbResult } from './errors.js';

export const llamadoSelect = `*,paciente:pacientes(id,nombre,dni),area:areas(*),
  cama:camas(*),enfermero:perfiles!llamados_enfermero_atencion_id_fkey(id,email,rol)`;
export const pacienteSelect = '*,area:areas(*),cama:camas(*),enfermero:perfiles(id,email,rol)';

export function applyFilters(query, filters) {
  for (const key of ['area_id', 'origen', 'tipo', 'estado']) {
    if (filters[key] !== undefined) query = query.eq(key, filters[key]);
  }
  if (filters.fecha_desde) query = query.gte('fecha_activacion', filters.fecha_desde);
  if (filters.fecha_hasta) query = query.lte('fecha_activacion', filters.fecha_hasta);
  return query;
}

export async function paginate(query, filters) {
  const page = filters.page || 1;
  const limit = filters.limit || 100;
  const result = await query.order('id').range((page - 1) * limit, page * limit - 1);
  return { data: dbResult(result), total: result.count, page, limit };
}

export async function allLlamados(db, filters) {
  const latest = dbResult(await applyFilters(db.from('llamados').select('id'), filters)
    .order('id', { ascending: false }).limit(1));
  if (!latest.length) return [];
  const rows = [];
  let cursor = 0;
  while (true) {
    const batch = dbResult(await applyFilters(db.from('llamados').select(llamadoSelect), filters)
      .gt('id', cursor).lte('id', latest[0].id).order('id').limit(500));
    if (!batch.length) break;
    rows.push(...batch);
    if (rows.length > 100000) throw new AppError(413, 'Acotar las fechas del reporte a menos de 100000 llamados');
    cursor = batch.at(-1).id;
  }
  return rows;
}
````

## src/utils/exports.js

````javascript
import PDFDocument from 'pdfkit';
import json2csv from 'json2csv';

const fields = ['id', 'paciente', 'area', 'cama', 'origen', 'tipo', 'estado',
  'fecha_activacion', 'fecha_atencion', 'tiempo_respuesta_seg', 'enfermero'];

export function exportRows(rows) {
  return rows.map(row => ({
    id: row.id, paciente: row.paciente?.nombre || '', area: row.area?.nombre || '',
    cama: row.cama?.nombre || '', origen: row.origen, tipo: row.tipo, estado: row.estado,
    fecha_activacion: row.fecha_activacion, fecha_atencion: row.fecha_atencion || '',
    tiempo_respuesta_seg: row.tiempo_respuesta_seg ?? '', enfermero: row.enfermero?.email || ''
  }));
}

export function createCsv(rows) {
  const safe = exportRows(rows).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key, typeof value === 'string' && /^[\s\uFEFF]*[=+\-@\t\r\n]/u.test(value) ? `'${value}` : value
  ])));
  return '\uFEFF' + new json2csv.Parser({ fields }).parse(safe);
}

export function createPdf(rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(20).text('Código Azul - Reporte de llamados');
    doc.moveDown().fontSize(10).text(`Generado: ${new Date().toISOString()} | Total: ${rows.length}`);
    for (const row of exportRows(rows)) {
      if (doc.y > 665) doc.addPage();
      doc.moveDown().fontSize(11).text(`#${row.id} | ${row.tipo} | ${row.estado}`);
      doc.fontSize(9).text(`Paciente: ${row.paciente} | Área: ${row.area} | Cama: ${row.cama}`);
      doc.text(`Origen: ${row.origen} | Activación: ${row.fecha_activacion}`);
      doc.text(`Atención: ${row.fecha_atencion || '-'} | Respuesta: ${row.tiempo_respuesta_seg === '' ? '-' : row.tiempo_respuesta_seg + ' s'}`);
      doc.text(`Enfermero: ${row.enfermero || '-'}`);
    }
    if (!rows.length) doc.moveDown().text('Sin llamados para los filtros seleccionados.');
    doc.end();
  });
}
````

## src/middlewares/authMiddleware.js

````javascript
import jwt from 'jsonwebtoken';
import { AppError, dbResult } from '../utils/errors.js';

const tokenOptions = { issuer: 'codigo-azul', audience: 'hospital' };

export function createAuth(db, secret) {
  async function authenticate(token) {
    let claims;
    try {
      claims = jwt.verify(token, secret, { ...tokenOptions, algorithms: ['HS256'] });
      if (!claims.sub || !Number.isInteger(claims.exp)) throw new Error();
    } catch {
      throw new AppError(401, 'Token inválido o expirado');
    }
    const profile = dbResult(await db.from('perfiles').select('id,email,rol')
      .eq('id', claims.sub).maybeSingle());
    if (!profile || !['Administrador', 'Generico'].includes(profile.rol)) {
      throw new AppError(401, 'Usuario no autorizado');
    }
    return { ...profile, exp: claims.exp };
  }
  return {
    authenticate,
    sign: profile => jwt.sign({ rol: profile.rol }, secret, {
      ...tokenOptions, subject: profile.id, algorithm: 'HS256', expiresIn: '1h'
    }),
    authMiddleware: async (req, res, next) => {
      try {
        const match = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
        if (!match) throw new AppError(401, 'Se requiere Bearer token');
        req.user = await authenticate(match[1]);
        next();
      } catch (error) { next(error); }
    }
  };
}

export const roleMiddleware = role => (req, res, next) => {
  if (req.user?.rol !== role) return next(new AppError(403, 'Permisos insuficientes'));
  next();
};
````

## src/middlewares/errorHandler.js

````javascript
import { AppError } from '../utils/errors.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') error = new AppError(400, 'JSON inválido');
  if (error.type === 'entity.too.large') error = new AppError(413, 'Cuerpo demasiado grande');
  if (!(error instanceof AppError)) console.error('Error interno', { name: error.name });
  res.status(error instanceof AppError ? error.status : 500).json({
    error: error instanceof AppError ? error.message : 'Error interno del servidor',
    ...(error.details ? { detalles: error.details } : {})
  });
}
````

## src/middlewares/validate.js

````javascript
import { body, param, query, matchedData, validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';

const types = ['Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'SalaEspera'];
const positiveId = field => field.isInt({ min: 1, max: 2147483647 }).toInt();
const text = (field, max) => field.isString().bail().trim().isLength({ min: 1, max });
const optional = (field, partial) => partial ? field.optional() : field;
const coordinate = field => field.isFloat().bail().toFloat().custom(Number.isFinite);

export const idRule = () => positiveId(param('id'));
export const loginRules = () => [
  body('email').isString().bail().trim().isEmail().isLength({ max: 254 }).toLowerCase(),
  body('password').isString().bail().isLength({ min: 1, max: 128 })
];
export const registerRules = () => [
  ...loginRules(), body('password').isLength({ min: 12, max: 128 }),
  body('rol').isIn(['Administrador', 'Generico'])
];
export const areaRules = (partial = false) => [
  text(optional(body('nombre'), partial), 120),
  optional(body('tipo'), partial).isIn(types),
  coordinate(optional(body('coord_x'), partial)), coordinate(optional(body('coord_y'), partial))
];
export const camaRules = (partial = false) => [
  positiveId(optional(body('area_id'), partial)), text(optional(body('nombre'), partial), 80),
  coordinate(optional(body('coord_x'), partial)), coordinate(optional(body('coord_y'), partial))
];
export const pacienteRules = (partial = false) => [
  text(optional(body('nombre'), partial), 160),
  optional(body('dni'), partial).isString().bail().matches(/^\d{6,12}$/),
  body('datos_medicos').optional().isString().isLength({ max: 20000 }),
  positiveId(body('cama_id').optional({ values: 'null' })),
  positiveId(optional(body('area_id'), partial)),
  body('enfermero_id').optional({ values: 'null' }).isUUID()
];
export const llamadoRules = () => [
  positiveId(body('paciente_id')), positiveId(body('area_id')),
  body('origen').isIn(['Cama', 'Bano']), body('tipo').isIn(['Normal', 'Emergencia'])
];
export const pagingRules = () => [
  positiveId(query('page').optional()), query('limit').optional().isInt({ min: 1, max: 500 }).toInt()
];
export const areaFilter = () => positiveId(query('area_id').optional());
export const pacienteFilters = () => [
  areaFilter(), positiveId(query('area').optional()),
  query('enfermero_id').optional().isUUID(), query('enfermero').optional().isUUID()
];
export const llamadoFilters = () => [
  areaFilter(), query('origen').optional().isIn(['Cama', 'Bano']),
  query('tipo').optional().isIn(['Normal', 'Emergencia']),
  query('estado').optional().isIn(['No Atendido', 'Atendido']),
  ...['fecha_desde', 'fecha_hasta'].map(key => query(key).optional().isISO8601({ strict: true })
    .bail().matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/).withMessage('Usar ISO 8601 con zona horaria')),
  query('fecha_hasta').optional().custom((value, { req }) => {
    if (req.query.fecha_desde && Date.parse(value) < Date.parse(req.query.fecha_desde)) {
      throw new Error('fecha_hasta debe ser mayor o igual a fecha_desde');
    }
    return true;
  })
];

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(400, 'Datos inválidos', errors.array().map(e => ({
    campo: e.path, mensaje: e.msg
  }))));
  req.input = Object.fromEntries(Object.entries(matchedData(req, {
    locations: ['body'], includeOptionals: true
  })).filter(([, value]) => value !== undefined));
  req.filters = matchedData(req, { locations: ['query'] });
  if (req.method === 'PUT' && !req.path.endsWith('/atender') && !Object.keys(req.input).length) {
    return next(new AppError(400, 'Enviar al menos un campo editable'));
  }
  next();
}
````

## src/controllers/index.js

````javascript
import { AppError, dbResult } from '../utils/errors.js';
import { paginate, applyFilters, allLlamados, llamadoSelect, pacienteSelect } from '../utils/queries.js';
import { createCsv, createPdf } from '../utils/exports.js';

export function createControllers({ db, newAuthClient, auth, publish }) {
  function crud(table, select = '*') {
    return {
      list: async (req, res) => {
        let query = db.from(table).select(select, { count: 'exact' });
        const area = req.filters.area_id ?? req.filters.area;
        const nurse = req.filters.enfermero_id ?? req.filters.enfermero;
        if (area !== undefined) query = query.eq('area_id', area);
        if (nurse !== undefined) query = query.eq('enfermero_id', nurse);
        res.json(await paginate(query, req.filters));
      },
      get: async (req, res) => res.json(dbResult(await db.from(table)
        .select(select).eq('id', req.params.id).single())),
      create: async (req, res) => res.status(201).json(dbResult(await db.from(table)
        .insert(req.input).select(select).single())),
      update: async (req, res) => res.json(dbResult(await db.from(table)
        .update(req.input).eq('id', req.params.id).select(select).single())),
      remove: async (req, res) => {
        dbResult(await db.from(table).delete().eq('id', req.params.id).select('id').single());
        res.status(204).end();
      }
    };
  }
  const authController = {
    login: async (req, res) => {
      // Cliente aislado: el login no modifica la sesión del cliente privilegiado.
      const { data, error } = await newAuthClient().auth.signInWithPassword(req.input);
      if (error) {
        if (error.status === 429) throw new AppError(429, 'Demasiados intentos');
        if (error.status >= 500 || !error.status) throw new AppError(503, 'Autenticación no disponible');
        throw new AppError(401, 'Credenciales inválidas');
      }
      const profile = dbResult(await db.from('perfiles').select('id,email,rol')
        .eq('id', data.user.id).maybeSingle());
      if (!profile) throw new AppError(403, 'El usuario no tiene perfil habilitado');
      res.json({ token: auth.sign(profile), token_type: 'Bearer', expires_in: 3600,
        rol: profile.rol, usuario: profile });
    },
    register: async (req, res) => {
      const { email, password, rol } = req.input;
      const { data, error } = await db.auth.admin.createUser({
        email, password, email_confirm: true, app_metadata: { rol }
      });
      if (error) {
        if (['email_exists', 'user_already_exists'].includes(error.code)) {
          throw new AppError(409, 'El usuario ya existe');
        }
        throw new AppError(error.status >= 500 ? 503 : 400, 'No se pudo crear el usuario');
      }
      // El trigger crea el perfil en la misma transacción que auth.users.
      res.status(201).json(dbResult(await db.from('perfiles').select('id,email,rol')
        .eq('id', data.user.id).single()));
    },
    me: (req, res) => {
      const { id, email, rol } = req.user;
      res.json({ id, email, rol });
    }
  };
  const llamados = {
    create: async (req, res) => {
      const row = dbResult(await db.rpc('crear_llamado', {
        p_paciente_id: req.input.paciente_id, p_area_id: req.input.area_id,
        p_origen: req.input.origen, p_tipo: req.input.tipo
      }));
      const event = { ...row, timestamp: row.fecha_activacion };
      publish('nuevoLlamado', event);
      if (row.tipo === 'Emergencia') publish('codigoAzul', event);
      publish('logSistema', `Llamado #${row.id} activado (${row.tipo}).`);
      res.status(201).json(row);
    },
    attend: async (req, res) => {
      const row = dbResult(await db.rpc('atender_llamado', {
        p_id: Number(req.params.id), p_enfermero_id: req.user.id
      }));
      publish('llamadoAtendido', { id: row.id, tiempo_respuesta_seg: row.tiempo_respuesta_seg,
        enfermero: row.enfermero, fecha_atencion: row.fecha_atencion });
      publish('logSistema', `Llamado #${row.id} atendido en ${row.tiempo_respuesta_seg} segundos.`);
      res.json(row);
    },
    list: async (req, res) => res.json(await paginate(applyFilters(
      db.from('llamados').select(llamadoSelect, { count: 'exact' }), req.filters
    ), req.filters)),
    active: async (req, res) => {
      req.filters.estado = 'No Atendido';
      return llamados.list(req, res);
    }
  };
  const reportes = {
    stats: async (req, res) => {
      const params = Object.fromEntries(['area_id', 'origen', 'tipo', 'estado', 'fecha_desde', 'fecha_hasta']
        .map(key => [`p_${key}`, req.filters[key] ?? null]));
      res.json(dbResult(await db.rpc('estadisticas_llamados', params)));
    },
    csv: async (req, res) => {
      const rows = await allLlamados(db, req.filters);
      res.attachment('llamados.csv').type('text/csv; charset=utf-8').send(createCsv(rows));
    },
    pdf: async (req, res) => {
      const rows = await allLlamados(db, req.filters);
      const pdf = await createPdf(rows);
      res.attachment('llamados.pdf').type('application/pdf').send(pdf);
    }
  };
  return { auth: authController, areas: crud('areas'), camas: crud('camas', '*,area:areas(*)'),
    pacientes: crud('pacientes', pacienteSelect), llamados, reportes };
}
````

## src/routes/index.js

````javascript
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { roleMiddleware } from '../middlewares/authMiddleware.js';
import * as v from '../middlewares/validate.js';

export function createRoutes(controllers, authMiddleware) {
  const router = Router();
  const admin = roleMiddleware('Administrador');
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Demasiados intentos. Intentar más tarde.' } });
  router.post('/auth/login', loginLimit, v.loginRules(), v.validate, controllers.auth.login);
  router.use(authMiddleware);
  router.post('/auth/register', admin, v.registerRules(), v.validate, controllers.auth.register);
  router.get('/auth/me', controllers.auth.me);

  for (const [resource, rules, filters] of [
    ['areas', v.areaRules, () => []],
    ['camas', v.camaRules, () => [v.areaFilter()]],
    ['pacientes', v.pacienteRules, v.pacienteFilters]
  ]) {
    const controller = controllers[resource];
    router.get(`/${resource}`, filters(), v.pagingRules(), v.validate, controller.list);
    router.post(`/${resource}`, admin, rules(), v.validate, controller.create);
    router.put(`/${resource}/:id`, ...(resource === 'pacientes' ? [] : [admin]),
      v.idRule(), rules(true), v.validate, controller.update);
    router.delete(`/${resource}/:id`, admin, v.idRule(), v.validate, controller.remove);
  }
  router.get('/pacientes/:id', v.idRule(), v.validate, controllers.pacientes.get);
  router.post('/llamados/crear', v.llamadoRules(), v.validate, controllers.llamados.create);
  router.put('/llamados/:id/atender', v.idRule(), v.validate, controllers.llamados.attend);
  router.get('/llamados/activos', v.llamadoFilters(), v.pagingRules(), v.validate, controllers.llamados.active);
  router.get('/llamados', v.llamadoFilters(), v.pagingRules(), v.validate, controllers.llamados.list);
  router.get('/reportes/estadisticas', v.llamadoFilters(), v.validate, controllers.reportes.stats);
  router.get('/reportes/export/pdf', v.llamadoFilters(), v.validate, controllers.reportes.pdf);
  router.get('/reportes/export/csv', v.llamadoFilters(), v.validate, controllers.reportes.csv);
  return router;
}
````

## src/sockets/index.js

````javascript
import { Server } from 'socket.io';

export function configureSockets(server, env, auth) {
  const io = new Server(server, {
    cors: { origin: env.origins, methods: ['GET', 'POST'] },
    allowRequest: (req, callback) => callback(null, !req.headers.origin || env.origins.includes(req.headers.origin))
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') throw new Error();
      socket.data.user = await auth.authenticate(token);
      next();
    } catch { next(new Error('No autorizado')); }
  });
  io.on('connection', socket => {
    socket.join('hospital');
    socket.emit('logSistema', 'Conectado al sistema Código Azul.');
    const expiry = setTimeout(() => socket.disconnect(true),
      Math.max(0, socket.data.user.exp * 1000 - Date.now()));
    expiry.unref();
    let checking = false;
    const check = setInterval(async () => {
      if (checking) return;
      checking = true;
      try { await auth.authenticate(socket.handshake.auth.token); }
      catch { socket.disconnect(true); }
      finally { checking = false; }
    }, 30000);
    check.unref();
    socket.on('disconnect', () => { clearTimeout(expiry); clearInterval(check); });
  });
  return io;
}
````

## src/app.js

````javascript
import express from 'express';
import cors from 'cors';
import { createAuth } from './middlewares/authMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/errors.js';
import { createControllers } from './controllers/index.js';
import { createRoutes } from './routes/index.js';

export function createApp({ env, db, newAuthClient, publish = () => {} }) {
  const app = express();
  const auth = createAuth(db, env.jwtSecret);
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);
  app.use(cors({
    origin: (origin, callback) => callback(
      origin && !env.origins.includes(origin) ? new AppError(403, 'Origen no permitido') : null, true
    ),
    exposedHeaders: ['Content-Disposition']
  }));
  app.use(express.json({ limit: '64kb' }));
  app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  const controllers = createControllers({ db, newAuthClient, auth, publish });
  app.use('/api', createRoutes(controllers, auth.authMiddleware));
  app.use((req, res, next) => next(new AppError(404, 'Ruta no encontrada')));
  app.use(errorHandler);
  return { app, auth };
}
````

## src/server.js

````javascript
import { createServer } from 'node:http';
import { readEnv } from './config/env.js';
import { createSupabase } from './config/supabase.js';
import { createApp } from './app.js';
import { configureSockets } from './sockets/index.js';

const env = readEnv();
const clients = createSupabase(env);
let io;
const { app, auth } = createApp({ env, ...clients,
  publish: (event, payload) => io.to('hospital').emit(event, payload) });
const server = createServer(app);
io = configureSockets(server, env, auth);
server.listen(env.port, '0.0.0.0', () => console.log(`Código Azul escuchando en puerto ${env.port}`));

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  io.close(() => { clearTimeout(timeout); process.exit(0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
````

## test/api.test.js

````javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { io as connect } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { configureSockets } from '../src/sockets/index.js';
import { allLlamados } from '../src/utils/queries.js';
import { createCsv, createPdf } from '../src/utils/exports.js';
import { dbResult } from '../src/utils/errors.js';

const admin = { id: '11111111-1111-4111-8111-111111111111', email: 'admin@hospital.com', rol: 'Administrador' };
const nurse = { id: '22222222-2222-4222-8222-222222222222', email: 'nurse@hospital.com', rol: 'Generico' };
const env = { jwtSecret: 'test-secret-with-more-than-32-characters', origins: ['http://localhost:5173'], trustProxy: 0 };

function fixture() {
  const state = { profiles: [admin, nurse], calls: [], mutations: [], events: [] };
  const db = {
    from(table) {
      let rows = table === 'perfiles' ? state.profiles : table === 'llamados' ? state.calls : [];
      let single = false;
      let count = false;
      const query = {
        select(columns, options) { count = options?.count === 'exact'; return this; },
        eq(key, value) { rows = rows.filter(row => String(row[key]) === String(value)); return this; },
        gt(key, value) { rows = rows.filter(row => row[key] > value); return this; },
        lte(key, value) { rows = rows.filter(row => row[key] <= value); return this; },
        gte(key, value) { rows = rows.filter(row => row[key] >= value); return this; },
        order(key, options) { rows = [...rows].sort((a,b) => (a[key] - b[key]) * (options?.ascending === false ? -1 : 1)); return this; },
        limit(value) { rows = rows.slice(0, Math.min(value, 2)); return this; },
        range(start, end) { rows = rows.slice(start, end + 1); return this; },
        maybeSingle() { single = true; return this; },
        single() { single = true; return this; },
        insert(input) { state.mutations.push({ table, input }); rows = [{ id: 1, ...input }]; return this; },
        update(input) { state.mutations.push({ table, input }); rows = [{ id: 1, ...input }]; return this; },
        delete() { rows = [{ id: 1 }]; return this; },
        then(resolve, reject) { return Promise.resolve({ data: single ? rows[0] ?? null : rows,
          error: null, count: count ? rows.length : null }).then(resolve, reject); }
      };
      return query;
    },
    async rpc(name, args) {
      if (name === 'crear_llamado') {
        const row = { id: 1, tipo: args.p_tipo, origen: args.p_origen, estado: 'No Atendido',
          fecha_activacion: new Date().toISOString(), paciente: { id: 1, nombre: 'Paciente' },
          area: { id: 1, nombre: 'Habitación' }, cama: { id: 1, nombre: 'Cama' } };
        state.calls.push(row);
        return { data: row, error: null };
      }
      if (name === 'atender_llamado') {
        const row = state.calls.find(row => row.id === args.p_id);
        if (!row) return { error: { code: 'PT404', message: 'Llamado no encontrado' } };
        if (row.estado === 'Atendido') return { error: { code: 'PT409', message: 'El llamado ya fue atendido' } };
        Object.assign(row, { estado: 'Atendido', tiempo_respuesta_seg: 15,
          fecha_atencion: new Date().toISOString(), enfermero: state.profiles.find(p => p.id === args.p_enfermero_id) });
        return { data: row, error: null };
      }
      return { data: { total_llamados: state.calls.length }, error: null };
    },
    auth: { admin: { async createUser(input) {
      const profile = { id: '33333333-3333-4333-8333-333333333333', email: input.email, rol: input.app_metadata.rol };
      state.profiles.push(profile);
      return { data: { user: profile }, error: null };
    } } }
  };
  const newAuthClient = () => ({ auth: { signInWithPassword: async input => input.password === 'valid-password'
    ? { data: { user: admin }, error: null }
    : { error: { status: 400, code: 'invalid_credentials' } } } });
  const result = createApp({ env, db, newAuthClient,
    publish: (event, payload) => state.events.push({ event, payload: structuredClone(payload) }) });
  return { ...result, db, state };
}

test('HTTP: autenticación, permisos y validaciones', async () => {
  const { app, auth, state } = fixture();
  const adminToken = auth.sign(admin);
  const nurseToken = auth.sign(nurse);
  await request(app).get('/health').expect(200);
  await request(app).get('/api/pacientes').expect(401);
  await request(app).get('/api/auth/me').set('Authorization', 'Bearer fake').expect(401);
  await request(app).get('/health').set('Origin', 'https://intruso.example').expect(403);
  const login = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'valid-password' }).expect(200);
  assert.equal(login.body.rol, 'Administrador');
  await request(app).post('/api/auth/login').send({ email: admin.email, password: 'incorrecta' }).expect(401);
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`).expect(200);
  for (const path of ['/auth/register', '/areas', '/camas', '/pacientes']) {
    await request(app).post(`/api${path}`).set('Authorization', `Bearer ${nurseToken}`).send({}).expect(403);
  }
  await request(app).post('/api/auth/register').set('Authorization', `Bearer ${adminToken}`)
    .send({ email: 'new@hospital.com', password: 'long-password-123', rol: 'Generico' }).expect(201);
  await request(app).post('/api/areas').set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Área', tipo: 'Habitacion', coord_x: 'infinito', coord_y: 0 }).expect(400);
  await request(app).put('/api/pacientes/1').set('Authorization', `Bearer ${nurseToken}`)
    .send({ cama_id: null, enfermero_id: null, rol: 'Administrador' }).expect(200);
  assert.deepEqual(state.mutations.at(-1).input, { cama_id: null, enfermero_id: null });
  await request(app).put('/api/pacientes/1').set('Authorization', `Bearer ${nurseToken}`).send({}).expect(400);
  await request(app).get('/api/llamados?fecha_desde=2026-09-15').set('Authorization', `Bearer ${nurseToken}`).expect(400);
  await request(app).get('/api/llamados?fecha_desde=2026-09-15T00:00:00Z&fecha_hasta=2026-09-14T00:00:00Z')
    .set('Authorization', `Bearer ${nurseToken}`).expect(400);
  const expired = jwt.sign({}, env.jwtSecret, { subject: admin.id, issuer: 'codigo-azul', audience: 'hospital', expiresIn: -1 });
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`).expect(401);
  state.profiles = state.profiles.map(p => p.id === admin.id ? { ...p, rol: 'Generico' } : p);
  await request(app).post('/api/areas').set('Authorization', `Bearer ${adminToken}`).send({}).expect(403);
});

test('HTTP: flujo de emergencia y eventos después de guardar', async () => {
  const { app, auth, state } = fixture();
  const token = auth.sign(nurse);
  const header = { Authorization: `Bearer ${token}` };
  await request(app).post('/api/llamados/crear').set(header)
    .send({ paciente_id: 1, area_id: 1, origen: 'Cama', tipo: 'Emergencia' }).expect(201);
  assert.deepEqual(state.events.map(e => e.event), ['nuevoLlamado', 'codigoAzul', 'logSistema']);
  assert.ok(state.events[0].payload.timestamp);
  await request(app).put('/api/llamados/1/atender').set(header).send({ enfermero_id: admin.id }).expect(200);
  assert.equal(state.events.find(e => e.event === 'llamadoAtendido').payload.enfermero.id, nurse.id);
  await request(app).put('/api/llamados/1/atender').set(header).expect(409);
  assert.equal(state.events.filter(e => e.event === 'llamadoAtendido').length, 1);
  const active = await request(app).get('/api/llamados/activos').set(header).expect(200);
  assert.equal(active.body.data.length, 0);
  await request(app).get('/api/reportes/export/csv').set(header).expect(200).expect('Content-Type', /text\/csv/);
  await request(app).get('/api/reportes/export/pdf').set(header).expect(200).expect('Content-Type', /application\/pdf/);
});

test('exportaciones sin truncamiento, CSV seguro y PDF vacío válido', async () => {
  const { db, state } = fixture();
  state.calls = Array.from({ length: 7 }, (_, i) => ({ id: i + 1 }));
  assert.equal((await allLlamados(db, {})).length, 7);
  const csv = createCsv([{ id: 1, paciente: { nombre: '=HYPERLINK("https://example.com")' }, tiempo_respuesta_seg: 0 }]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(createCsv([]).includes('fecha_activacion'));
  assert.equal((await createPdf([])).subarray(0, 5).toString(), '%PDF-');
  for (const code of ['23503', '23001']) {
    assert.throws(() => dbResult({ error: { code } }), { status: 409 });
  }
});

test('HTTP: CRUD, filtros y llamado normal', async () => {
  const { app, auth, state } = fixture();
  const header = { Authorization: `Bearer ${auth.sign(admin)}` };
  for (const [resource, body] of [
    ['areas', { nombre: 'Habitación', tipo: 'Habitacion', coord_x: 0, coord_y: 1 }],
    ['camas', { nombre: 'Cama', area_id: 1, coord_x: 0, coord_y: 1 }],
    ['pacientes', { nombre: 'Paciente', dni: '12345678', area_id: 1 }]
  ]) {
    await request(app).get(`/api/${resource}?page=1&limit=10`).set(header).expect(200);
    await request(app).post(`/api/${resource}`).set(header).send(body).expect(201);
    await request(app).put(`/api/${resource}/1`).set(header).send({ nombre: 'Otro' }).expect(200);
    await request(app).delete(`/api/${resource}/1`).set(header).expect(204);
  }
  await request(app).get('/api/pacientes?area=1&enfermero=' + nurse.id).set(header).expect(200);
  await request(app).post('/api/llamados/crear').set(header)
    .send({ paciente_id: 1, area_id: 1, origen: 'Cama', tipo: 'Normal' }).expect(201);
  assert.ok(!state.events.some(e => e.event === 'codigoAzul'));
  const response = await request(app).get('/api/llamados?tipo=Normal&estado=No%20Atendido')
    .set(header).expect(200);
  assert.equal(response.body.data.length, 1);
  await request(app).get('/api/reportes/estadisticas').set(header).expect(200);
});

test('Socket.IO: rechaza anónimos y autoriza room hospital', { timeout: 10000 }, async t => {
  const { app, auth } = fixture();
  const server = createServer(app);
  const io = configureSockets(server, env, auth);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => io.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const anonymous = connect(url, { reconnection: false });
  t.after(() => anonymous.close());
  const [error] = await once(anonymous, 'connect_error');
  assert.equal(error.message, 'No autorizado');
  const client = connect(url, { auth: { token: auth.sign(nurse) }, reconnection: false });
  t.after(() => client.close());
  await once(client, 'connect');
  assert.equal(io.sockets.adapter.rooms.get('hospital').size, 1);
  const event = once(client, 'codigoAzul');
  io.to('hospital').emit('codigoAzul', { id: 42 });
  assert.equal((await event)[0].id, 42);
});
````

## test/schema.test.js

````javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const adminId = '11111111-1111-4111-8111-111111111111';
const nurseId = '22222222-2222-4222-8222-222222222222';

test('SQL completo: integridad, permisos, llamados y estadísticas', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_app_meta_data jsonb,
      raw_user_meta_data jsonb);
  `);
  await db.exec(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
  const value = async (sql, params = []) => (await db.query(sql, params)).rows[0]?.value;
  await db.query(`insert into auth.users values ($1, 'admin@hospital.com', '{"rol":"Administrador"}', '{}'),
    ($2, 'enfermero@hospital.com', '{}', '{"rol":"Administrador"}')`, [adminId, nurseId]);

  await t.test('trigger transaccional y rol sin confiar en metadatos del usuario', async () => {
    assert.equal(await value('select rol as value from public.perfiles where id = $1', [adminId]), 'Administrador');
    assert.equal(await value('select rol as value from public.perfiles where id = $1', [nurseId]), 'Generico');
    await db.query("update auth.users set email = 'enfermeria@hospital.com' where id = $1", [nurseId]);
    assert.equal(await value('select email as value from public.perfiles where id = $1', [nurseId]), 'enfermeria@hospital.com');
  });
  await db.exec(`
    insert into public.areas(nombre,tipo,coord_x,coord_y) values
      ('Habitación 1','Habitacion',0,0), ('Baño 1','Bano',10,20), ('Habitación 2','Habitacion',30,40);
    insert into public.camas(area_id,nombre,coord_x,coord_y) values (1,'Cama 1',1,2);
    insert into public.pacientes(nombre,dni,cama_id,area_id) values ('Paciente A','12345678',1,1);
  `);
  await t.test('cama ocupada, cama de otra área y DNI repetido son rechazados', async () => {
    await assert.rejects(db.exec("insert into public.pacientes(nombre,dni,cama_id,area_id) values ('B','22345678',1,1)"), { code: '23505' });
    await assert.rejects(db.exec('update public.pacientes set area_id=3 where id=1'), { code: '23503' });
    await assert.rejects(db.exec("insert into public.pacientes(nombre,dni,area_id) values ('B','12345678',1)"), { code: '23505' });
  });
  await t.test('roles de cliente sin acceso a tablas ni RPC', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.exec('select * from public.pacientes'), { code: '42501' });
      await assert.rejects(db.exec('select public.estadisticas_llamados()'), { code: '42501' });
      await db.exec('reset role');
    }
    assert.equal(await value("select count(*)::int as value from pg_class where relname in ('perfiles','areas','camas','pacientes','llamados') and relrowsecurity"), 5);
  });
  await db.exec('set role service_role');
  let call;
  await t.test('crear llamado, validar origen y evitar activos duplicados', async () => {
    call = await value("select public.crear_llamado(1,1,'Cama','Emergencia') as value");
    assert.equal(call.estado, 'No Atendido');
    assert.equal(call.paciente.nombre, 'Paciente A');
    assert.equal(call.cama.id, 1);
    assert.equal(call.area.id, 1);
    await assert.rejects(db.exec("select public.crear_llamado(1,1,'Cama','Emergencia')"), { code: '23505' });
    await assert.rejects(db.exec("select public.crear_llamado(1,3,'Cama','Normal')"), { code: 'PT400' });
    await assert.rejects(db.exec("select public.crear_llamado(1,1,'Bano','Normal')"), { code: 'PT400' });
    await assert.rejects(db.exec("select public.crear_llamado(999,1,'Cama','Normal')"), { code: 'PT404' });
    const bathroom = await value("select public.crear_llamado(1,2,'Bano','Normal') as value");
    assert.equal(bathroom.cama, null);
  });
  await t.test('dos atenciones: una sola confirma y conserva al enfermero', async () => {
    await db.query("update public.llamados set fecha_activacion=clock_timestamp()-interval '12 seconds' where id=$1", [call.id]);
    const outcomes = await Promise.allSettled([
      value('select public.atender_llamado($1,$2) as value', [call.id, nurseId]),
      value('select public.atender_llamado($1,$2) as value', [call.id, adminId])
    ]);
    assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(outcomes.find(r => r.status === 'rejected').reason.code, 'PT409');
    const row = outcomes.find(r => r.status === 'fulfilled').value;
    assert.equal(row.enfermero.id, nurseId);
    assert.equal(row.estado, 'Atendido');
    assert.ok(row.tiempo_respuesta_seg >= 12);
    await assert.rejects(db.query('select public.atender_llamado(999,$1)', [nurseId]), { code: 'PT404' });
    await assert.rejects(db.exec('delete from public.pacientes where id=1'),
      error => ['23503', '23001'].includes(error.code));
  });
  await t.test('estadísticas completas con más de 1000 llamados y filtros', async () => {
    await db.query(`insert into public.llamados(paciente_id,area_id,origen,tipo,estado,
      fecha_activacion,fecha_atencion,tiempo_respuesta_seg,enfermero_atencion_id)
      select 1,2,'Bano','Normal','Atendido',now()-interval '10 seconds',now(),10,$1
      from generate_series(1,1201)`, [nurseId]);
    const stats = await value('select public.estadisticas_llamados() as value');
    assert.equal(stats.total_llamados, 1203);
    assert.equal(stats.atendidos, 1202);
    assert.equal(stats.no_atendidos, 1);
    assert.equal(stats.por_area.reduce((sum, g) => sum + g.total_llamados, 0), 1203);
    const active = await value("select public.estadisticas_llamados(p_estado=>'No Atendido') as value");
    assert.equal(active.total_llamados, 1);
    assert.equal(active.tiempo_promedio_respuesta_seg, null);
    assert.equal(active.por_area[0].tiempo_promedio_respuesta_seg, null);
    const none = await value("select public.estadisticas_llamados(p_fecha_hasta=>'2000-01-01Z') as value");
    assert.equal(none.total_llamados, 0);
    assert.deepEqual(none.por_area, []);
  });
});
````

## README.md

````markdown
# Código Azul — Backend

## Instalación

Requiere Node.js 24 y un proyecto Supabase con Data API habilitada para `public`.

```sh
npm ci
cp .env.example .env
```

En PowerShell: `Copy-Item .env.example .env`.

1. Ejecutar `supabase/schema.sql` completo en el SQL Editor de un proyecto nuevo. El archivo es de instalación inicial y se ejecuta una sola vez.
2. En Supabase Auth, deshabilitar el registro público de usuarios. El backend utiliza `auth.admin.createUser`.
3. Crear el primer usuario con email y contraseña desde **Authentication → Users → Add user**, con email confirmado.
4. Asignarle el rol administrador desde el SQL Editor:

```sql
update public.perfiles set rol = 'Administrador' where email = 'admin@hospital.com';
select id, email, rol from public.perfiles where email = 'admin@hospital.com';
```

5. Completar `.env`: `SUPABASE_KEY` debe ser una clave secreta de servidor (`sb_secret_...`) o la clave heredada `service_role`. `JWT_SECRET` es un secreto propio, independiente del de Supabase. `FRONTEND_URL` acepta orígenes separados por comas, sin rutas.

```sh
npm test
npm run dev
```

## Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@hospital.com","password":"tu-contraseña-segura"}
```

Respuesta: `{ "token": "...", "token_type": "Bearer", "expires_in": 3600, "rol": "Administrador", "usuario": { "id": "...", "email": "...", "rol": "Administrador" } }`.

Enviar `Authorization: Bearer TOKEN` en todas las demás rutas. El JWT dura una hora; al expirar se requiere un nuevo login. El rol vigente se obtiene de `perfiles` en cada petición. Eliminar el perfil revoca acceso HTTP. Socket.IO vuelve a verificarlo cada 30 segundos y desconecta al expirar el JWT.

```http
POST /api/auth/register
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json

{"email":"enfermero@hospital.com","password":"contraseña-segura-123","rol":"Generico"}
```

## Endpoints y cuerpos

| Método | Ruta | Acceso / datos |
| --- | --- | --- |
| POST | `/api/auth/login` | Público: email, password |
| POST | `/api/auth/register` | Admin: email, password (12–128 caracteres), rol |
| GET | `/api/auth/me` | Autenticado |
| GET | `/api/areas` | Autenticado |
| POST | `/api/areas` | Admin: nombre, tipo, coord_x, coord_y |
| PUT | `/api/areas/:id` | Admin: campos a modificar |
| DELETE | `/api/areas/:id` | Admin |
| GET | `/api/camas` | Autenticado; filtro area_id |
| POST | `/api/camas` | Admin: area_id, nombre, coord_x, coord_y |
| PUT | `/api/camas/:id` | Admin: campos a modificar |
| DELETE | `/api/camas/:id` | Admin |
| GET | `/api/pacientes` | Autenticado; filtros area_id/area y enfermero_id/enfermero |
| GET | `/api/pacientes/:id` | Autenticado |
| POST | `/api/pacientes` | Admin: nombre, dni, area_id; opcionales datos_medicos, cama_id, enfermero_id |
| PUT | `/api/pacientes/:id` | Autenticado: campos a modificar |
| DELETE | `/api/pacientes/:id` | Admin |
| POST | `/api/llamados/crear` | Autenticado: paciente_id, area_id, origen, tipo |
| PUT | `/api/llamados/:id/atender` | Autenticado; cuerpo vacío; enfermero tomado del JWT |
| GET | `/api/llamados` | Autenticado; filtros de llamados |
| GET | `/api/llamados/activos` | Autenticado; siempre estado No Atendido |
| GET | `/api/reportes/estadisticas` | Autenticado; filtros de llamados |
| GET | `/api/reportes/export/pdf` | Autenticado; filtros de llamados |
| GET | `/api/reportes/export/csv` | Autenticado; filtros de llamados |
| GET | `/health` | Público; proceso activo |

Tipos de área: `Quirofano`, `Habitacion`, `Bano`, `Recepcion`, `SalaEspera`.
Los PUT son actualizaciones parciales. Usar `null` en cama_id/enfermero_id para desasignarlos.
`dni` es una cadena de entre 6 y 12 dígitos. Las coordenadas son números finitos.

Listados: `?page=1&limit=100`, máximo 500 por página. Respuesta `{ data: [], total: 0, page: 1, limit: 100 }`. Leer todas las páginas de `/llamados/activos` para reconstruir el tablero completo.

Filtros de llamados/reportes: `area_id`, `origen` (`Cama`/`Bano`), `tipo` (`Normal`/`Emergencia`), `estado` (`No Atendido`/`Atendido`), `fecha_desde`, `fecha_hasta`. Fechas ISO 8601 con zona horaria; límites inclusivos sobre fecha_activacion. Ejemplo: `?fecha_desde=2026-09-01T00:00:00Z&fecha_hasta=2026-09-30T23:59:59Z`. Codificar `+` como `%2B` si se usan offsets positivos.

Las estadísticas incluyen total_llamados, atendidos, no_atendidos, tiempo_promedio_respuesta_seg, por_area, por_tipo y por_origen. El promedio considera solo llamados atendidos; es null si no existen. Cada grupo tiene sus propios totales y promedio.

Las exportaciones recuperan todas las páginas hasta 100000 registros; si se supera ese límite devuelven 413 para solicitar un rango menor. No son una instantánea transaccional: una atención simultánea puede reflejarse durante su lectura.

## Reglas de integridad

- Cada cama admite un paciente. La cama asignada debe pertenecer al área del paciente.
- Para origen Cama, el paciente debe tener cama en el área indicada. Para origen Bano, el área debe ser de tipo Bano; puede diferir del área donde está internado.
- Un llamado activo por paciente/área/origen/tipo. Duplicados devuelven 409.
- Atender es atómico: solo una petición tiene éxito; las siguientes reciben 409.
- Se añaden cama_id y enfermero_atencion_id a llamados para conservar la cama de origen y la identidad de quien atendió. El nombre de cama/paciente/área mostrado es el vigente.
- Borrar registros referenciados por llamados devuelve 409 y conserva el historial.
- RLS está habilitado y el acceso directo con anon/authenticated está revocado. Toda operación pasa por Express. No publicar SUPABASE_KEY ni JWT_SECRET.
- Todos los usuarios autenticados tienen acceso operativo al hospital y a reportes; los permisos Admin se aplican a las rutas indicadas.

## Socket.IO

Ejemplo para el frontend con `socket.io-client`:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', { auth: { token } });
socket.on('connect', async () => {
  // Consultar todas las páginas de /api/llamados/activos y reconciliar por id.
});
socket.on('nuevoLlamado', llamado => console.log(llamado));
socket.on('codigoAzul', llamado => console.log('Emergencia', llamado));
socket.on('llamadoAtendido', evento => console.log(evento));
socket.on('logSistema', mensaje => console.log(mensaje));
socket.on('connect_error', error => console.error(error.message));
```

El servidor incorpora cada conexión autorizada a `hospital`. `nuevoLlamado` y `codigoAzul` incluyen el llamado, paciente (id/nombre/dni), área, cama y timestamp. `llamadoAtendido` incluye id, tiempo_respuesta_seg, enfermero y fecha_atencion. `logSistema` es texto plano. Los eventos se emiten después de confirmar la escritura en PostgreSQL. Reconectar y consultar llamados activos permite recuperar el estado ante desconexiones; los eventos no tienen entrega persistente.

## Deploy en Render

1. Subir estos archivos a un repositorio Git, incluyendo package-lock.json y excluyendo .env.
2. Crear un **Web Service** conectado al repositorio, runtime Node.
3. Build Command: `npm ci --omit=dev`. Start Command: `npm start`.
4. Configurar NODE_VERSION=24, NODE_ENV=production, TRUST_PROXY=1, SUPABASE_URL, SUPABASE_KEY, JWT_SECRET y FRONTEND_URL con el origen HTTPS del frontend. Render proporciona PORT automáticamente.
5. Health Check Path: `/health`. Usar una instancia siempre activa para recibir llamados sin arranque en frío.
6. Usar HTTPS/WSS en el frontend. Desplegar una sola instancia: el adaptador de Socket.IO y el limitador de login usan memoria local. Varias instancias requieren un adaptador compartido y un almacén compartido para el limitador.

## Verificación

`npm test` ejecuta pruebas HTTP/Socket.IO con dependencias simuladas y pruebas del SQL real en PostgreSQL embebido (PGlite). No requiere credenciales ni modifica proyectos remotos. Para probar Supabase real, configurar .env y verificar login, creación de usuario, CRUD, llamados y descargas contra el proyecto configurado.

## Referencias

- [Supabase: creación administrativa de usuarios](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Supabase: login con contraseña](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Socket.IO: autenticación mediante middleware](https://socket.io/docs/v4/middlewares/)
- [Render: deploy de Express](https://render.com/docs/deploy-node-express-app)
````

## supabase/schema.sql

````sql
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  rol text not null default 'Generico' check (rol in ('Administrador', 'Generico'))
);

create table public.areas (
  id serial primary key,
  nombre text not null check (char_length(trim(nombre)) between 1 and 120),
  tipo text not null check (tipo in ('Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'SalaEspera')),
  coord_x double precision not null check (coord_x > '-Infinity'::float8 and coord_x < 'Infinity'::float8),
  coord_y double precision not null check (coord_y > '-Infinity'::float8 and coord_y < 'Infinity'::float8)
);

create table public.camas (
  id serial primary key,
  area_id integer not null references public.areas(id) on delete restrict,
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  coord_x double precision not null check (coord_x > '-Infinity'::float8 and coord_x < 'Infinity'::float8),
  coord_y double precision not null check (coord_y > '-Infinity'::float8 and coord_y < 'Infinity'::float8),
  unique (id, area_id),
  unique (area_id, nombre)
);

create table public.pacientes (
  id serial primary key,
  nombre text not null check (char_length(trim(nombre)) between 1 and 160),
  dni text not null unique check (dni ~ '^[0-9]{6,12}$'),
  datos_medicos text not null default '' check (char_length(datos_medicos) <= 20000),
  cama_id integer unique,
  area_id integer not null references public.areas(id) on delete restrict,
  enfermero_id uuid references public.perfiles(id) on delete set null,
  foreign key (cama_id, area_id) references public.camas(id, area_id) on delete restrict
);

create table public.llamados (
  id serial primary key,
  paciente_id integer not null references public.pacientes(id) on delete restrict,
  area_id integer not null references public.areas(id) on delete restrict,
  origen text not null check (origen in ('Cama', 'Bano')),
  tipo text not null check (tipo in ('Normal', 'Emergencia')),
  estado text not null default 'No Atendido' check (estado in ('No Atendido', 'Atendido')),
  fecha_activacion timestamptz not null default now(),
  fecha_atencion timestamptz,
  tiempo_respuesta_seg integer,
  -- Conservan la cama de origen y quién atendió realmente.
  cama_id integer references public.camas(id) on delete restrict,
  enfermero_atencion_id uuid references public.perfiles(id) on delete restrict,
  check ((origen = 'Cama' and cama_id is not null) or (origen = 'Bano' and cama_id is null)),
  check (
    (estado = 'No Atendido' and fecha_atencion is null and tiempo_respuesta_seg is null
      and enfermero_atencion_id is null)
    or
    (estado = 'Atendido' and fecha_atencion is not null and fecha_atencion >= fecha_activacion
      and tiempo_respuesta_seg is not null and tiempo_respuesta_seg >= 0
      and enfermero_atencion_id is not null)
  )
);

create index pacientes_area_idx on public.pacientes(area_id);
create index pacientes_enfermero_idx on public.pacientes(enfermero_id);
create index llamados_paciente_idx on public.llamados(paciente_id);
create index llamados_cama_idx on public.llamados(cama_id);
create index llamados_enfermero_idx on public.llamados(enfermero_atencion_id);
create index llamados_area_fecha_idx on public.llamados(area_id, fecha_activacion);
create index llamados_fecha_idx on public.llamados(fecha_activacion);
create index llamados_tipo_fecha_idx on public.llamados(tipo, fecha_activacion);
create index llamados_origen_fecha_idx on public.llamados(origen, fecha_activacion);
create index llamados_activos_idx on public.llamados(id) where estado = 'No Atendido';
create unique index llamados_activos_unicos_idx
  on public.llamados(paciente_id, area_id, origen, tipo) where estado = 'No Atendido';

-- Este trigger requiere privilegios para escribir desde auth.users hacia public.
-- El rol procede de metadatos administrativos, nunca de user_metadata.
create function private.sincronizar_perfil()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.perfiles(id, email, rol)
    values (new.id, new.email,
      case when new.raw_app_meta_data->>'rol' = 'Administrador'
        then 'Administrador' else 'Generico' end);
  else
    update public.perfiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function private.sincronizar_perfil() from public, anon, authenticated;
create trigger codigo_azul_perfil_insert after insert on auth.users
  for each row execute function private.sincronizar_perfil();
create trigger codigo_azul_perfil_email after update of email on auth.users
  for each row execute function private.sincronizar_perfil();

-- Importa usuarios existentes sin concederles privilegios administrativos.
insert into public.perfiles(id, email)
select id, email from auth.users where email is not null;

create function public.llamado_detalle(p_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(l) || jsonb_build_object(
    'paciente', jsonb_build_object('id', p.id, 'nombre', p.nombre, 'dni', p.dni),
    'area', to_jsonb(a), 'cama', to_jsonb(c),
    'enfermero', case when e.id is null then null else to_jsonb(e) end
  )
  from public.llamados l
  join public.pacientes p on p.id = l.paciente_id
  join public.areas a on a.id = l.area_id
  left join public.camas c on c.id = l.cama_id
  left join public.perfiles e on e.id = l.enfermero_atencion_id
  where l.id = p_id;
$$;

create function public.crear_llamado(p_paciente_id integer, p_area_id integer, p_origen text, p_tipo text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_paciente public.pacientes%rowtype;
  v_area public.areas%rowtype;
  v_id integer;
begin
  if p_origen is null or p_origen not in ('Cama', 'Bano')
    or p_tipo is null or p_tipo not in ('Normal', 'Emergencia') then
    raise sqlstate 'PT400' using message = 'Origen o tipo inválido';
  end if;
  select * into v_paciente from public.pacientes where id = p_paciente_id for share;
  if not found then raise sqlstate 'PT404' using message = 'Paciente no encontrado'; end if;
  select * into v_area from public.areas where id = p_area_id for share;
  if not found then raise sqlstate 'PT404' using message = 'Área no encontrada'; end if;
  if p_origen = 'Cama' and (v_paciente.cama_id is null or v_paciente.area_id <> p_area_id) then
    raise sqlstate 'PT400' using message = 'El paciente no tiene cama en esa área';
  end if;
  if p_origen = 'Bano' and v_area.tipo <> 'Bano' then
    raise sqlstate 'PT400' using message = 'El área de origen debe ser un baño';
  end if;
  insert into public.llamados(paciente_id, area_id, origen, tipo, cama_id)
  values (p_paciente_id, p_area_id, p_origen, p_tipo,
    case when p_origen = 'Cama' then v_paciente.cama_id else null end)
  returning id into v_id;
  return public.llamado_detalle(v_id);
end;
$$;

create function public.atender_llamado(p_id integer, p_enfermero_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_llamado public.llamados%rowtype;
  v_fecha timestamptz;
begin
  select * into v_llamado from public.llamados where id = p_id for update;
  if not found then raise sqlstate 'PT404' using message = 'Llamado no encontrado'; end if;
  if v_llamado.estado = 'Atendido' then
    raise sqlstate 'PT409' using message = 'El llamado ya fue atendido';
  end if;
  if p_enfermero_id is null or not exists (select 1 from public.perfiles where id = p_enfermero_id) then
    raise sqlstate 'PT400' using message = 'Usuario de atención inválido';
  end if;
  v_fecha := greatest(clock_timestamp(), v_llamado.fecha_activacion);
  update public.llamados set estado = 'Atendido', fecha_atencion = v_fecha,
    tiempo_respuesta_seg = floor(extract(epoch from (v_fecha - fecha_activacion)))::integer,
    enfermero_atencion_id = p_enfermero_id
  where id = p_id;
  return public.llamado_detalle(p_id);
end;
$$;

create function public.estadisticas_llamados(
  p_area_id integer default null, p_origen text default null, p_tipo text default null,
  p_estado text default null, p_fecha_desde timestamptz default null, p_fecha_hasta timestamptz default null
)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with filtrados as (
    select l.*, a.nombre as area_nombre from public.llamados l
    join public.areas a on a.id = l.area_id
    where (p_area_id is null or l.area_id = p_area_id)
      and (p_origen is null or l.origen = p_origen)
      and (p_tipo is null or l.tipo = p_tipo)
      and (p_estado is null or l.estado = p_estado)
      and (p_fecha_desde is null or l.fecha_activacion >= p_fecha_desde)
      and (p_fecha_hasta is null or l.fecha_activacion <= p_fecha_hasta)
  ), grupos as (
    select case when grouping(area_id) = 0 then 'area'
      when grouping(tipo) = 0 then 'tipo' else 'origen' end as dimension,
      area_id, area_nombre, tipo, origen,
      count(*) as total_llamados,
      count(*) filter (where estado = 'Atendido') as atendidos,
      count(*) filter (where estado = 'No Atendido') as no_atendidos,
      round(avg(tiempo_respuesta_seg), 2) as tiempo_promedio_respuesta_seg
    from filtrados group by grouping sets ((area_id, area_nombre), (tipo), (origen))
  )
  select jsonb_build_object(
    'total_llamados', count(*),
    'atendidos', count(*) filter (where estado = 'Atendido'),
    'no_atendidos', count(*) filter (where estado = 'No Atendido'),
    'tiempo_promedio_respuesta_seg', round(avg(tiempo_respuesta_seg), 2),
    'por_area', coalesce((select jsonb_agg(to_jsonb(g) - 'dimension' - 'tipo' - 'origen' order by area_id)
      from grupos g where dimension = 'area'), '[]'::jsonb),
    'por_tipo', coalesce((select jsonb_agg(to_jsonb(g) - 'dimension' - 'area_id' - 'area_nombre' - 'origen' order by tipo)
      from grupos g where dimension = 'tipo'), '[]'::jsonb),
    'por_origen', coalesce((select jsonb_agg(to_jsonb(g) - 'dimension' - 'area_id' - 'area_nombre' - 'tipo' order by origen)
      from grupos g where dimension = 'origen'), '[]'::jsonb)
  ) from filtrados;
$$;

alter table public.perfiles enable row level security;
alter table public.areas enable row level security;
alter table public.camas enable row level security;
alter table public.pacientes enable row level security;
alter table public.llamados enable row level security;

-- Acceso exclusivamente desde Express mediante la clave secreta/service_role.
revoke all on table public.perfiles, public.areas, public.camas, public.pacientes, public.llamados
  from public, anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.perfiles, public.areas, public.camas,
  public.pacientes, public.llamados to service_role;
revoke all on sequence public.areas_id_seq, public.camas_id_seq, public.pacientes_id_seq,
  public.llamados_id_seq from public, anon, authenticated;
grant usage, select on sequence public.areas_id_seq, public.camas_id_seq, public.pacientes_id_seq,
  public.llamados_id_seq to service_role;

revoke all on function public.llamado_detalle(integer), public.crear_llamado(integer,integer,text,text),
  public.atender_llamado(integer,uuid),
  public.estadisticas_llamados(integer,text,text,text,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.llamado_detalle(integer), public.crear_llamado(integer,integer,text,text),
  public.atender_llamado(integer,uuid),
  public.estadisticas_llamados(integer,text,text,text,timestamptz,timestamptz) to service_role;

notify pgrst, 'reload schema';
commit;
````
