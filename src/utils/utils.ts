import { Profile, Query } from './types';

export function arrayToMultiMap<Item, Key extends string | number, Value = Item>(
  items: readonly Item[],
  keyFunction: (item: Item) => Key,
  valueFunction = (item: Item) => item as unknown as Value,
): Map<Key, Value[]> {
  return items.reduce((map, item) => {
    const key = keyFunction(item);
    let values = map.get(key);

    if (values === undefined) {
      values = [];
      map.set(key, values);
    }

    values.push(valueFunction(item));
    return map;
  }, new Map<Key, Value[]>());
}

export function getQueryTypesFromProfile(profile: Profile) {
  function getAllQueryTypes(query: Query, aggregator: Set<string>) {
    aggregator.add(query.type);

    if (query.children !== undefined) {
      for (const child of query.children) {
        getAllQueryTypes(child, aggregator);
      }
    }
  }

  const queryTypes = new Set<string>();
  const topLevelQueries = profile.shards.flatMap((shard) => shard.searches).flatMap((search) => search.query);
  for (const query of topLevelQueries) {
    getAllQueryTypes(query, queryTypes);
  }

  return queryTypes;
}

export function getAllLeafQueriesFromProfile(profile: Profile): Query[] {
  function getAllLeafQueries(query: Query): Query[] {
    const children = query.children;
    if (children === undefined) {
      return [query];
    }

    return children.flatMap((child) => getAllLeafQueries(child));
  }

  return profile.shards
    .flatMap((shard) => shard.searches)
    .flatMap((search) => search.query)
    .flatMap((query) => getAllLeafQueries(query));
}
