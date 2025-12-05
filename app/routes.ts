import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("bookmarks", "routes/bookmarks.tsx"),
  route("settings", "routes/settings.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;
