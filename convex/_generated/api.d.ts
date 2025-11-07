/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as clerk from "../clerk.js";
import type * as error from "../error.js";
import type * as form from "../form.js";
import type * as formEditHistory from "../formEditHistory.js";
import type * as formField from "../formField.js";
import type * as formSubmission from "../formSubmission.js";
import type * as http from "../http.js";
import type * as publicForm from "../publicForm.js";
import type * as tag from "../tag.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chat: typeof chat;
  clerk: typeof clerk;
  error: typeof error;
  form: typeof form;
  formEditHistory: typeof formEditHistory;
  formField: typeof formField;
  formSubmission: typeof formSubmission;
  http: typeof http;
  publicForm: typeof publicForm;
  tag: typeof tag;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
