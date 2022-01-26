import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

import { Query, QueryType } from './types';

export const colors: string[] = [
  '#b54605',
  '#4a768f',
  '#a69890',
  '#e68d5a',
  '#93c7e6',
  '#d98dab',
  '#52806d',
  '#07e089',
  '#e80761',
  '#870c3d',
  '#4e2366',
  '#44732a',
  '#a2f277',
  '#a92feb',
  '#4e2a61',
];

const SYMBOLS = {
  Empty: '',
  Full: '█',
  SevenEighths: '█',
  ThreeQuarters: '█',
  FiveEighths: '█',
  Half: '▌',
  ThreeEighths: '▌',
  Quarter: '▌',
  Eighth: '▌',
};

const getSymbolNormal = (value: number) => {
  if (value <= 0) {
    return SYMBOLS.Empty;
  } else if (value <= 1 / 8) {
    return SYMBOLS.Eighth;
  } else if (value <= 1 / 4) {
    return SYMBOLS.Quarter;
  } else if (value <= 3 / 8) {
    return SYMBOLS.ThreeEighths;
  } else if (value <= 1 / 2) {
    return SYMBOLS.Half;
  } else if (value <= 5 / 8) {
    return SYMBOLS.FiveEighths;
  } else if (value <= 3 / 4) {
    return SYMBOLS.ThreeQuarters;
  } else if (value <= 7 / 8) {
    return SYMBOLS.SevenEighths;
  } else {
    return SYMBOLS.Full;
  }
};

const splitNumberToParts = (value = 0): [number, number] => {
  const [int, rest = '0'] = value.toString().split('.');
  return [parseInt(int, 10), parseInt(rest, 10) / Math.pow(10, rest.length)];
};

function durationToWidth(duration: number, maxDuration: number, maxWidth: number) {
  return (duration / maxDuration) * maxWidth;
}

function singleQueryToString(
  query: Query,
  options: {
    maxWidth: number;
    maxDuration: number;
    colorByQueryType?: Map<QueryType, string>;
  },
): string {
  const width = durationToWidth(query.time_in_nanos, options.maxDuration, options.maxWidth);
  const color = options.colorByQueryType?.get(query.type);
  const colorString = (value: string, background: boolean = false) =>
    color === undefined ? value : background ? chalk.bgHex(color)(value) : chalk.hex(color)(value);

  let [integer, rest] = splitNumberToParts(width);
  const padding = colorString(getSymbolNormal(1));

  const duration = durationToString(query.time_in_nanos);
  const label = integer > query.type.length + 1 + duration.length ? `${query.type} (${duration})` : query.type;
  let result = '';

  if (integer > label.length + 1) {
    result += `${colorString(label, true)}${padding}`;
    integer -= label.length + 1;
  }

  // shamelessly taken from
  // https://github.com/gribnoysup/wunderbar/blob/b42565b9af92addc82c53bea6e4512339822578d/lib/bars.js
  result += colorString(
    getSymbolNormal(integer).repeat(integer) + getSymbolNormal(integer === 0 && rest === 0 ? 0.001 : rest),
  );

  return result;
}

/**
 * @param durationInNanos
 * @returns formatted string from the duration
 */
export function durationToString(durationInNanos: number): string {
  const microSeconds = Math.round(durationInNanos / 1000);
  const ms = Math.round(microSeconds / 1000);

  if (ms >= 1) {
    return `${ms} ms`;
  }

  if (microSeconds >= 1) {
    return `${microSeconds} µs`;
  }

  return `${durationInNanos} ns`;
}

/**
 * @param query to render to a string
 * @param options - configure the output, maxWidth controls the width of the string, colorByQueryType allows coloring the output
 * @returns query and its children rendered as a string
 */
export function queryToString(
  query: Query,
  { maxWidth = 80, colorByQueryType }: { maxWidth?: number; colorByQueryType?: Map<QueryType, string> } = {},
): string {
  const totalDuration = query.time_in_nanos;

  // We do a BFS traversal of the query, adding each of the strings with an estimated offset into the "line" that it appears on
  const visited: { offset: number; line: number; query: Query }[] = [];
  const queue: { offset: number; line: number; query: Query }[] = [{ offset: 0, line: 0, query }];

  while (queue.length > 0) {
    const next = queue.shift();
    visited.push(next);

    if (next.query.children !== undefined) {
      let offset = next.offset;

      for (const child of next.query.children) {
        queue.push({ offset, line: next.line + 1, query: child });
        offset += Math.ceil(durationToWidth(child.time_in_nanos, totalDuration, maxWidth));
      }
    }
  }

  // And then we can just build up the lines by going over the visited nodes, the BFS already ensured that we
  // have the visited list ordered (first by line, then by offset)
  const lines: string[] = [];
  for (const node of visited) {
    let line = lines[node.line] ?? '';
    let lineLength = stripAnsi(line).length;

    if (lineLength < node.offset) {
      line += ' '.repeat(node.offset - lineLength);
    }

    line += singleQueryToString(node.query, { maxDuration: totalDuration, maxWidth, colorByQueryType });
    lines[node.line] = line;
  }

  return lines.join('\n');
}
