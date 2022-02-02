import chalk from 'chalk';

import {
  arrayToMultiMap,
  queryToString,
  durationToString,
  getQueryTypesFromProfile,
  getAllLeafQueriesFromProfile,
  getColor,
  Profile,
  NestedProfile,
} from './utils';

/**
 * @param profileData JSON of the profilin data, checked against a runtype
 * @param options configuring the resulting string
 * @returns stringified represenentation of the profile
 */
export const stringifyProfile = (
  profileData: unknown,
  options: { maxWidth: number; color: boolean } = { maxWidth: 80, color: true },
): string => {
  const result: string[] = [];
  let profile: Profile;

  if (NestedProfile.guard(profileData)) {
    profile = NestedProfile.check(profileData).profile;
  } else {
    profile = Profile.check(profileData);
  }

  const maxTimeInNanos = profile.shards
    .flatMap((shard) => shard.searches)
    .flatMap((search) => search.query)
    .reduce((max, query) => Math.max(max, query.time_in_nanos), 0);

  // Determine colors to use per query type
  const queryTypes = getQueryTypesFromProfile(profile);
  const colorByQueryType = options.color
    ? new Map<string, string>(Array.from(queryTypes.values()).map((type, idx) => [type, getColor(type)]))
    : undefined;

  const gray = options.color ? chalk.gray : (value: string) => value;
  const colorString = options.color ? (hex: string) => chalk.hex(hex) : (_: string) => (value: string) => value;

  // Write out a legend if the output is colored
  if (colorByQueryType !== undefined) {
    result.push(gray('Legend:'));

    for (const [type, color] of colorByQueryType) {
      result.push(`${colorString(color)('███')} - ${type}`);
    }

    result.push('');
  }

  // Render each shard separately
  for (const shard of profile.shards) {
    result.push(`${gray('Shard:')} ${shard.id}`);
    const queries = shard.searches.flatMap((query) => query.query);

    for (const query of queries) {
      const relativeMaxWidth = Math.floor((query.time_in_nanos / maxTimeInNanos) * options.maxWidth);
      result.push(queryToString(query, { maxWidth: relativeMaxWidth, colorByQueryType }));
    }

    result.push('');
  }

  // Render stats of the leaf queries (the ones that actually take up the time in the end)
  // Also render their breakdown aggregates over all shards
  result.push(gray('Leaf queries (across all shards/queries):'));
  const queries = getAllLeafQueriesFromProfile(profile);
  const queriesByTypeDescription = arrayToMultiMap(queries, ({ type, description }) => `${type} ${description}`);
  const durationsByDescription = Array.from(queriesByTypeDescription.values())
    .map((queries) => {
      const sumTimeInNanos = queries.reduce((sum, query) => sum + query.time_in_nanos, 0);
      const breakdown = queries.reduce((memo, query) => {
        for (const [key, value] of Object.entries(query.breakdown)) {
          memo[key] = (memo[key] ?? 0) + value;
        }

        return memo;
      }, {} as { [key: string]: number });

      return {
        type: queries[0].type,
        description: queries[0].description,
        breakdown,
        color: colorByQueryType?.get(queries[0].type),
        time_in_nanos: sumTimeInNanos,
      };
    })
    .sort((a, b) => b.time_in_nanos - a.time_in_nanos);

  for (const value of durationsByDescription) {
    result.push(
      `${durationToString(value.time_in_nanos)} - ${colorString(value.color)(`${value.type} ${value.description}`)}`,
    );

    const breakdown = Array.from(Object.entries(value.breakdown)).sort((a, b) => b[1] - a[1]);
    for (const [key, aggregate] of breakdown) {
      if (aggregate > 0) {
        result.push(`\t${durationToString(aggregate)} ${gray(key)}`);
      }
    }

    result.push('');
  }

  return result.join('\n');
};
