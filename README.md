# visualise-elastic-profile

A simple tool for visualising the results from the [Profile API](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-profile.html) of ElasticSearch.

## Installation

```
yarn global add visualise-elastic-profile
```

## Usage

```
visualise-elastic-profile profile.json
```

Where `profile.json` is a path to a JSON file with the contents of the `profile` key from the Profile API (or just a full response from the Search API that includes the `profile` key). An example of such a file is included in this repository as `example.json`.

Output from this command is a simplified report of the profiling data, including a stringified timeline for each shard, and an overview of the leaf queries (i.e queries that do not have any children) by how much aggregated time is spent in those.

In this README, the output is not coloured, whilst in reality it would be colored with different colour per query type.

```
Legend:
███ - BooleanQuery
███ - ConstantScoreQuery
███ - DocValuesFieldExistsQuery
███ - TermQuery
███ - IndexOrDocValuesQuery

Shard: shard-0
BooleanQuery (9 ms)█████████████████████████████████████████████████████████████
██████ConstantScoreQuery█████ConstantScoreQuery (4 ms)██████████████████████▌
█████▌TermQuery (2 ms)██████ BooleanQuery (4 ms)██████████████████████▌
                             ███████████████████████████████████████▌
                             ████████████████▌  ███████████████████▌
                             ████               ██

Leaf queries (across all shards/queries):
3 ms - TermQuery status:working
	2 ms build_scorer
	1 ms advance
	4 µs create_weight
	1 µs advance_count
	440 ns next_doc
	201 ns build_scorer_count
	8 ns next_doc_count
	3 ns create_weight_count

2 ms - IndexOrDocValuesQuery LatLonShapeBoundingBoxQuery: field=location_geoshape:Rectangle(lat=55.77657301866769 TO 66.51326044311186 lon=22.5 TO 45.0)
	2 ms build_scorer
	307 µs advance
	1 µs create_weight
	283 ns advance_count
	74 ns build_scorer_count
	1 ns create_weight_count

1 ms - IndexOrDocValuesQuery location:[55.776573051698506 TO 66.5132604399696],[22.5 TO 45.0]
	1 ms build_scorer
	158 µs advance
	27 µs match
	1 µs create_weight
	334 ns advance_count
	74 ns build_scorer_count
	4 ns match_count
	1 ns create_weight_count

1 ms - DocValuesFieldExistsQuery DocValuesFieldExistsQuery [field=id]
	482 µs advance
	101 µs build_scorer
	283 ns advance_count
	150 ns create_weight
	74 ns build_scorer_count
	1 ns create_weight_count

1 ms - TermQuery user_id:1
	358 µs build_scorer
	192 µs advance
	11 µs next_doc
	1 µs create_weight
	1 µs advance_count
	254 ns next_doc_count
	74 ns build_scorer_count
	1 ns create_weight_count
```

## API

The package also exposes an API that can be used in Node, allowing converting the profile into a string

```ts
import { stringifyProfile } from 'visualise-elastic-profile';

const profile = { shards: [{ searches: [{ query: {...} }] }] };
console.log(stringifyProfile(profile)); // same output as if using the CLI tool, width defaults to 80 and colours are enabled

console.log(stringifyProfile(profile, { maxWidth: 100, color: false })); // black-and-white output and with a fixed width of 100
```
