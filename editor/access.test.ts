import { beforeAll, describe, expect, test } from "bun:test";
import { verifyAccessJwt } from "./access.ts";

const config = { teamDomain: "team.cloudflareaccess.com", aud: "app-aud", email: "lh4@pm.me" };
const now = Date.UTC(2026, 9, 24);

const b64url = (data: string | Uint8Array) =>
	Buffer.from(typeof data === "string" ? new TextEncoder().encode(data) : data)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");

type Keys = { privateKey: CryptoKey; jwk: JsonWebKey & { kid: string } };

async function keypair(kid: string): Promise<Keys> {
	const { privateKey, publicKey } = (await crypto.subtle.generateKey(
		{ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
		true,
		["sign", "verify"],
	)) as CryptoKeyPair;
	return { privateKey, jwk: { ...(await crypto.subtle.exportKey("jwk", publicKey)), kid } };
}

async function sign(keys: Keys, claims: Record<string, unknown>, kid = keys.jwk.kid): Promise<string> {
	const input = `${b64url(JSON.stringify({ alg: "RS256", kid, typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
	const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keys.privateKey, new TextEncoder().encode(input));
	return `${input}.${b64url(new Uint8Array(sig))}`;
}

const good = {
	iss: "https://team.cloudflareaccess.com",
	aud: ["app-aud"],
	email: "LH4@pm.me",
	exp: now / 1000 + 3600,
	iat: now / 1000 - 60,
};

describe("verifyAccessJwt", () => {
	let team: Keys;
	let other: Keys;
	beforeAll(async () => {
		team = await keypair("team-key");
		other = await keypair("other-key");
	});

	test("accepts a token for the allowed email, matching case-insensitively", async () => {
		expect(await verifyAccessJwt(await sign(team, good), config, [team.jwk], now)).toBe("lh4@pm.me");
	});

	test.each([
		["another email", { email: "someone@else.com" }, "email not allowed"],
		["another application's audience", { aud: ["other-aud"] }, "bad audience"],
		["another team's issuer", { iss: "https://evil.cloudflareaccess.com" }, "bad issuer"],
		["an expired session", { exp: now / 1000 - 1 }, "expired"],
		["a token with no email", { email: undefined }, "email not allowed"],
	])("rejects %s", async (_name, override, error) => {
		const token = await sign(team, { ...good, ...override });
		await expect(verifyAccessJwt(token, config, [team.jwk], now)).rejects.toThrow(error);
	});

	test("rejects a token signed by a key that claims the team's key id", async () => {
		const forged = await sign(other, good, "team-key");
		await expect(verifyAccessJwt(forged, config, [team.jwk], now)).rejects.toThrow("bad signature");
	});

	test("rejects a tampered payload", async () => {
		const [h, , s] = (await sign(team, good)).split(".");
		const tampered = `${h}.${b64url(JSON.stringify({ ...good, email: "lh4@pm.me", exp: good.exp + 86400 * 365 }))}.${s}`;
		await expect(verifyAccessJwt(tampered, config, [team.jwk], now)).rejects.toThrow("bad signature");
	});

	test("rejects alg none", async () => {
		const token = `${b64url(JSON.stringify({ alg: "none", kid: "team-key" }))}.${b64url(JSON.stringify(good))}.`;
		await expect(verifyAccessJwt(token, config, [team.jwk], now)).rejects.toThrow();
	});
});
