/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

  
export default {
	async fetch(request, env, ctx) {
		// Handle POST method (store email and name by hashed key)
		if (request.method === 'POST') {
			const { name, email, cyber } = await request.json();

			// Validate input
			if (!email || !("@" in email) || !name || cyber.toLowerCase() !== 'cyber') {
				return new Response(JSON.stringify({ success: false, message: 'Invalid input or "cyber" misspelled' }), { status: 400 });
			}
			const myText = new TextEncoder().encode(email);

			const digest = await crypto.subtle.digest(
			  {
				name: 'SHA-256',
			  },
			  myText // The data you want to hash as an ArrayBuffer
			);
			const uniqueKey = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')

			// Check if this email hash already exists in the KV store
			let storedData = await env.EMAILS.get(uniqueKey);

			if (!storedData) {
				// If the email hash doesn't exist, store it in the KV store
				await env.EMAILS.put(uniqueKey, JSON.stringify({ name, email }));
			}

			// Return the unique hashed key
			return new Response(JSON.stringify({
				success: true,
				uniqueKey: uniqueKey
			}), { status: 200 });
		}

		// Handle GET method (retrieve email and name by hash)
		if (request.method === 'GET') {
			const url = new URL(request.url);
			const hash = url.searchParams.get('hash');

			if (!hash) {
				return new Response('Hash is required', { status: 400 });
			}
			// Check if the hash exists in the KV store
			let storedData = await env.EMAILS.get(hash);
			if (!storedData) {
				return new Response('Hash not found', { status: 404 });
			}

			// Parse the stored data (it's stored as a JSON string)
			storedData = JSON.parse(storedData);

			// Return the stored email and name
			return new Response(JSON.stringify({
				success: true,
				email: storedData.email,
				name: storedData.name
			}), { status: 200 });
		}

		// Handle methods other than POST and GET
		return new Response('Method Not Allowed', { status: 405 });

	}
}