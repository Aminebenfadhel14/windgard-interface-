import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json(
    { error: { code: 'internal', message: 'Something went wrong. Please try again.' } },
    { status: 500 },
  );
}
