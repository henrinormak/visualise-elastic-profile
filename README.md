# visualise-elastic-profile

A simple tool for visualising the results from the [Profile API](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-profile.html) of ElasticSearch.

![Demo](https://github.com/henrinormak/visualise-elastic-profile/raw/main/images/demo.gif)

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

## API

The package also exposes an API that can be used in Node, allowing converting the profile into a string

```ts
import { stringifyProfile } from 'visualise-elastic-profile';

const profile = { shards: [{ searches: [{ query: {...} }] }] };
console.log(stringifyProfile(profile)); // same output as if using the CLI tool, width defaults to 80 and colours are enabled

console.log(stringifyProfile(profile, { maxWidth: 100, color: false })); // black-and-white output and with a fixed width of 100
```

## Limitations / Known issues

Currently it only supports the "non-humanised" output from the Profile API, i.e it expects the durations to be in nanoseconds.
