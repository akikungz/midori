import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import type { paths } from "@midori/types/api";

export const fetchClient = createFetchClient<paths>();

export const api = createClient(fetchClient);

type ErrorWithOptionalMessage = {
	message?: string;
	error?: string;
	detail?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

export function getApiErrorMessage(error: unknown): string | null {
	if (!error) {
		return null;
	}

	if (typeof error === "string") {
		return error;
	}

	if (error instanceof Error) {
		return error.message || null;
	}

	if (!isRecord(error)) {
		return null;
	}

	const directMessage =
		(error as ErrorWithOptionalMessage).message ||
		(error as ErrorWithOptionalMessage).detail ||
		(error as ErrorWithOptionalMessage).error;

	if (typeof directMessage === "string" && directMessage.trim().length > 0) {
		return directMessage;
	}

	const nestedError = error.error;
	if (isRecord(nestedError)) {
		const nestedMessage =
			(nestedError as ErrorWithOptionalMessage).message ||
			(nestedError as ErrorWithOptionalMessage).detail ||
			(nestedError as ErrorWithOptionalMessage).error;

		if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
			return nestedMessage;
		}
	}

	return null;
}
