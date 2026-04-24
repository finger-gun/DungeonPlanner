/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessPolicies from "../accessPolicies.js";
import type * as auth from "../auth.js";
import type * as characters from "../characters.js";
import type * as crossOriginHttp from "../crossOriginHttp.js";
import type * as devSeedAccounts from "../devSeedAccounts.js";
import type * as dungeons from "../dungeons.js";
import type * as errors from "../errors.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as model from "../model.js";
import type * as packs from "../packs.js";
import type * as roleAccess from "../roleAccess.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as seedState from "../seedState.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";
import type * as workspaceProvisioning from "../workspaceProvisioning.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accessPolicies: typeof accessPolicies;
  auth: typeof auth;
  characters: typeof characters;
  crossOriginHttp: typeof crossOriginHttp;
  devSeedAccounts: typeof devSeedAccounts;
  dungeons: typeof dungeons;
  errors: typeof errors;
  helpers: typeof helpers;
  http: typeof http;
  model: typeof model;
  packs: typeof packs;
  roleAccess: typeof roleAccess;
  roles: typeof roles;
  seed: typeof seed;
  seedState: typeof seedState;
  sessions: typeof sessions;
  users: typeof users;
  workspaceProvisioning: typeof workspaceProvisioning;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
