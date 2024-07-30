export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.startsWith('/secure')) {
      return handleSecureRequest(request, env);
    }

    return new Response('Not found (wrong path)', { status: 404 });
  }
}

async function handleSecureRequest(request, env) {
  const email = request.headers.get('cf-access-authenticated-user-email') || 'unknown@example.com';
  const country = request.cf.country ? request.cf.country.toLowerCase() : 'unknown';
  const timestamp = new Date().toISOString();

  const countryLink = `<a href="/secure/${country}">${country.toUpperCase()}</a>`;
  const responseBody = `${email} authenticated at ${timestamp} from ${countryLink}`;

  if (request.method === 'GET' && new URL(request.url).pathname === `/secure/${country}`) {
    const flagImage = await fetchFlagImage(country, env.R2_BUCKET);
    return flagImage;
  }

  return new Response(responseBody, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function fetchFlagImage(country, bucket) {
  const objectKey = `${country}.png`;

  try {
    const object = await bucket.get(objectKey);

    if (!object) {
      console.log(`Object not found for ${objectKey}`);
      return new Response('Not Found', { status: 404 });
    }

    const body = await object.arrayBuffer();

    return new Response(body, {
      headers: { 'Content-Type': 'image/png' }
    });
  } catch (error) {
    console.log(`Error fetching flag image for ${country}: ${error}`);
    return new Response('Internal Server Error', { status: 500 });
  }
}
