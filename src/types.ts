/** Object form of an ingredient when shorthand is not enough. */
export interface IngredientObject {
  item?: string;
  tag?: string;
  count?: number;
  slot?: string;
  /** Tags the query item has; ignored on stored recipes. */
  tags?: string[];
}

/** Item or tag ingredient: a type-id string, or an object with count/slot/tag. */
export type Ingredient = string | IngredientObject;

/** One catalog document. */
export interface Recipe {
  id: string;
  stations: string[];
  inputs: Ingredient[];
  outputs: Ingredient[];
  type?: string;
  pattern?: string[];
  key?: Record<string, Ingredient>;
  leftover?: Ingredient;
  priority?: number;
  duration?: number;
  energy?: number;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Compact list row. */
export interface ListEntry {
  id: string;
  type?: string;
  stations: string[];
  leftover?: Ingredient;
}

/** Filters for `list`. */
export interface ListFilter {
  station?: string;
  output?: string;
  leftover?: string;
}

/** Yield of a match — no recipe id. */
export interface MatchResult {
  outputs: Ingredient[];
  leftover?: Ingredient;
  duration?: number;
  energy?: number;
  extra?: Record<string, unknown>;
  type?: string;
}

/** Match / result ask. */
export interface MatchQuery {
  station: string;
  grid?: (string | null)[];
  pattern?: string[];
  key?: Record<string, Ingredient>;
  inputs?: Ingredient[];
}

/** IPC hello reply / ready payload fields. */
export interface HelloReply {
  schema: number;
  minecraft?: string;
}

/** Register ask over IPC. */
export interface RegisterAsk {
  recipes: Recipe[];
  source?: string;
  rev?: number;
}

/** Sync ask over IPC. */
export interface SyncAsk {
  source: string;
  rev: number;
}

/** Sync reply. */
export interface SyncReply {
  same: boolean;
}
