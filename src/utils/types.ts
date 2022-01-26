import * as Runtypes from 'runtypes';

export type QueryType = string;
export const QueryType = Runtypes.String;

const BaseQueryRuntype = Runtypes.Record({
  type: QueryType,
  description: Runtypes.String,
  time_in_nanos: Runtypes.Number,
  breakdown: Runtypes.Dictionary(Runtypes.Number, Runtypes.String),
});
type BaseQueryRuntype = Omit<Runtypes.Static<typeof BaseQueryRuntype>, 'type'> & { type: QueryType };

export type Query = BaseQueryRuntype & { children?: Query[] };
export const Query: Runtypes.Runtype<Query> = Runtypes.Lazy(() =>
  BaseQueryRuntype.And(
    Runtypes.Partial({
      children: Runtypes.Array(Query),
    }),
  ),
);

export const Profile = Runtypes.Record({
  shards: Runtypes.Array(
    Runtypes.Record({
      id: Runtypes.String,
      searches: Runtypes.Array(
        Runtypes.Record({
          query: Runtypes.Array(Query),
          rewrite_time: Runtypes.Number,
          collector: Runtypes.Array(
            Runtypes.Record({
              name: Runtypes.String,
              reason: Runtypes.String,
              time_in_nanos: Runtypes.Number,
            }),
          ),
        }),
      ),
      fetch: Runtypes.Record({
        type: Runtypes.String,
        description: Runtypes.String,
        time_in_nanos: Runtypes.Number,
        breakdown: Runtypes.Dictionary(Runtypes.Number, Runtypes.String),
      }),
    }),
  ),
});
export type Profile = Runtypes.Static<typeof Profile>;

export const NestedProfile = Runtypes.Record({
  profile: Profile,
});
export type NestedProfile = Runtypes.Static<typeof NestedProfile>;
