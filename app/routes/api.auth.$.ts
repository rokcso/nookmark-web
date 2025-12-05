import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { auth } from '~/lib/auth/auth.server';

// Handle all Better Auth API requests
export async function loader({ request }: LoaderFunctionArgs) {
  return auth.handler(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return auth.handler(request);
}
