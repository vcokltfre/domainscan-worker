import { jaroWinkler } from "jaro-winkler-typescript"

function getJSONResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    status: status,
  })
}

export async function handleRequest(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)

  const domain = searchParams.get("domain")

  if (!domain) {
    return getJSONResponse({
      "detail": "Parameter `domain` must be provided.",
      "code": 0x01,
    }, 400)
  }

  if (!domain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/)) {
    return getJSONResponse({
      "detail": "Invalid domain provided.",
      "code": 0x02,
    }, 400)
  }

  const domains = await DOMAINS.get("domains") || "discord.com"
  const domainList = domains.split(";")

  const results = []
  let isScam = false

  for (const kvDomain of domainList) {
    if (domain === kvDomain) {
      return getJSONResponse({
        "domain": domain,
        "results": [],
        "is_scam": false,
      }, 200)
    }

    const score = jaroWinkler(kvDomain, domain)
    const isDomainScam = score >= 0.85

    results.push({
      "domain": kvDomain,
      "score": score,
      "isScam": isDomainScam,
    })

    if (isDomainScam) {
      isScam = true
    }
  }

  return getJSONResponse({
    "domain": domain,
    "results": results,
    "is_scam": isScam,
  }, 200)
}
