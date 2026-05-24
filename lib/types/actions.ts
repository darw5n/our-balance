export type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true } & T)
  | { success: false; error: string }

export type ActionResultWithId = ActionResult<{ id: string }>
