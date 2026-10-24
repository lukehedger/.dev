/** Verification of Cloudflare Access application tokens (Cf-Access-Jwt-Assertion). */

export type AccessConfig = {
	/** e.g. "lukehedger.cloudflareaccess.com" */
	teamDomain: string;
	/** Application Audience (AUD) tag */
	aud: string;
	/** The only email allowed to use the editor */
	email: string;
};

type Jwk = JsonWebKey & { kid?: string };

const b64urlDecode = (s: string): Uint8Array => {
	const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
	return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

const decodeJson = (s: string): Record<string, unknown> => JSON.parse(new TextDecoder().decode(b64urlDecode(s)));

/**
 * Returns the verified email, or throws. Checks the RS256 signature against the
 * team's signing keys, the issuer, the audience, expiry and the allowed email.
 */
export async function verifyAccessJwt(token: string, config: AccessConfig, keys: Jwk[], now = Date.now()): Promise<string> {
	const [h, p, s] = token.split(".");
	if (!h || !p || !s) throw new Error("malformed token");
	const header = decodeJson(h);
	if (header.alg !== "RS256") throw new Error("unexpected alg");
	const jwk = keys.find((k) => k.kid === header.kid);
	if (!jwk) throw new Error("unknown signing key");
	const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
	const valid = await crypto.subtle.verify(
		"RSASSA-PKCS1-v1_5",
		key,
		b64urlDecode(s) as BufferSource,
		new TextEncoder().encode(`${h}.${p}`) as BufferSource,
	);
	if (!valid) throw new Error("bad signature");

	const claims = decodeJson(p);
	if (claims.iss !== `https://${config.teamDomain}`) throw new Error("bad issuer");
	const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
	if (!aud.includes(config.aud)) throw new Error("bad audience");
	const seconds = now / 1000;
	if (typeof claims.exp !== "number" || claims.exp < seconds) throw new Error("expired");
	if (typeof claims.nbf === "number" && claims.nbf > seconds + 60) throw new Error("not yet valid");
	const email = typeof claims.email === "string" ? claims.email.toLowerCase() : "";
	if (email !== config.email.toLowerCase()) throw new Error("email not allowed");
	return email;
}

let cached: { teamDomain: string; keys: Jwk[]; fetchedAt: number } | null = null;

/** The team's current signing keys, cached for an hour. */
export async function getAccessKeys(teamDomain: string, refresh = false): Promise<Jwk[]> {
	if (!refresh && cached?.teamDomain === teamDomain && Date.now() - cached.fetchedAt < 3_600_000) return cached.keys;
	const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
	if (!res.ok) throw new Error(`certs ${res.status}`);
	const { keys } = (await res.json()) as { keys: Jwk[] };
	cached = { teamDomain, keys, fetchedAt: Date.now() };
	return keys;
}
