import { Value, TokenMap, AssetId } from "@blazecardano/core";

/**
 * Merges two Value objects into a single Value object by combining their coins and multiassets.
 *
 * @param {Value} a - The first Value object.
 * @param {Value} b - The second Value object.
 * @returns {Value} - The resulting Value object after merging.
 */
export function merge(a: Value, b: Value): Value {
  let ma: TokenMap | undefined;
  if (!a.multiasset()) {
    ma = b.multiasset();
  } else {
    ma = a.multiasset()!;
    let bma = b.multiasset();
    if (bma) {
      for (const key of bma.keys()) {
        let a = ma.get(key);
        let b = bma.get(key)!;
        if (a) {
          ma.set(key, a + b);
        } else {
          ma.set(key, b);
        }
      }
    }
  }
  return new Value(a.coin() + b.coin(), ma);
}

/**
 * Negates the coin and multiasset values of a Value object.
 *
 * @param {Value} v - The Value object to negate.
 * @returns {Value} - The resulting Value object after negation.
 */
export function negate(v: Value): Value {
  let entries = v.multiasset()?.entries();
  let tokenMap: TokenMap = new Map();
  if (entries) {
    for (const entry of entries) {
      tokenMap.set(entry[0], -entry[1]);
    }
  }
  return new Value(-v.coin(), tokenMap);
}

/**
 * Subtracts the values of one Value object from another.
 *
 * @param {Value} a - The Value object to subtract from.
 * @param {Value} b - The Value object to subtract.
 * @returns {Value} - The resulting Value object after subtraction.
 */
export function sub(a: Value, b: Value): Value {
  return merge(a, negate(b));
}

/**
 * Determines the intersection of assets between two Value objects.
 *
 * @param {Value} a - The first Value object.
 * @param {Value} b - The second Value object.
 * @returns {number} - The count of intersecting assets.
 */
export function intersect(a: Value, b: Value): number {
  let count = a.coin() != 0n && b.coin() != 0n ? 1 : 0;
  let multiAssetA = a.multiasset();
  let multiAssetB = b.multiasset();
  if (multiAssetA && multiAssetB) {
    for (const [asset] of multiAssetA) {
      if (multiAssetB.get(asset) != undefined) {
        count += 1;
      }
    }
  }
  return count;
}

/**
 * Filters out the positive coin and multiasset values from a Value object.
 *
 * @param {Value} v - The Value object to filter.
 * @returns {Value} - A new Value object containing only positive values.
 */
export function positives(v: Value): Value {
  let entries = v.multiasset()?.entries();
  let coin = v.coin() > 0n ? v.coin() : 0n;
  let tokenMap: TokenMap = new Map();
  if (entries) {
    for (const entry of entries) {
      if (entry[1] > 0n) {
        tokenMap.set(entry[0], entry[1]);
      }
    }
  }
  return new Value(coin, tokenMap);
}

/**
 * Filters out the negative coin and multiasset values from a Value object.
 *
 * @param {Value} v - The Value object to filter.
 * @returns {Value} - A new Value object containing only negative values.
 */
export function negatives(v: Value): Value {
  let entries = v.multiasset()?.entries();
  let coin = v.coin() < 0n ? v.coin() : 0n;
  let tokenMap: TokenMap = new Map();
  if (entries) {
    for (const entry of entries) {
      if (entry[1] < 0n) {
        tokenMap.set(entry[0], entry[1]);
      }
    }
  }
  return new Value(coin, tokenMap);
}

/**
 * Lists all assets (including 'lovelace' if present) in a Value object.
 *
 * @param {Value} v - The Value object to inspect.
 * @returns {(AssetId | 'lovelace')[]} - An array of asset identifiers.
 */
export function assets(v: Value): (AssetId | "lovelace")[] {
  const assets: (AssetId | "lovelace")[] = v.coin() == 0n ? [] : ["lovelace"];
  let assetKeys = v.multiasset()?.keys();
  if (assetKeys) {
    for (const asset of assetKeys) {
      assets.push(asset);
    }
  }
  return assets;
}

/**
 * Counts the number of distinct asset types in a Value object.
 *
 * @param {Value} v - The Value object to count asset types in.
 * @returns {number} - The count of distinct asset types.
 */
export function assetTypes(v: Value): number {
  let count = v.coin() == 0n ? 0 : 1;
  let entries = v.multiasset()?.entries();
  if (entries) {
    for (const _entry of entries) {
      count += 1;
    }
  }
  return count;
}

/**
 * Determines if a Value object is empty (no coin and no multiassets).
 *
 * @param {Value} v - The Value object to check.
 * @returns {boolean} - True if the Value object is empty, false otherwise.
 */
export function empty(v: Value): boolean {
  return assetTypes(v) == 0;
}

/**
 * A constant Value object with zero coins and no assets.
 *
 * @returns {Value} - The zero Value object.
 */
export const zero: () => Value = () => new Value(0n);

/**
 * Creates a new Value object with the specified amount of lovelace and assets.
 *
 * @param {bigint} lovelace - The amount of lovelace.
 * @param {...[string, bigint][]} assets - The assets to include in the Value object.
 * @returns {Value} - The newly created Value object.
 */
export function makeValue(
  lovelace: bigint,
  ...assets: [string, bigint][]
): Value {
  if (assets.length == 0) {
    return Value.fromCore({ coins: lovelace });
  }
  let tokenMap: Map<AssetId, bigint> = new Map();
  for (const [asset, qty] of assets) {
    tokenMap.set(AssetId(asset), qty);
  }
  return Value.fromCore({
    coins: lovelace,
    assets: tokenMap,
  });
}