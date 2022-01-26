import { Command, Options, command, param, option } from 'clime';
import { File } from 'clime/bld/castable';

import { stringifyProfile } from '../index';

export class CommandOptions extends Options {
  @option({
    description: 'enable/disable coloring the output',
    default: false,
    toggle: true,
  })
  noColor?: boolean;

  @option({
    description: 'max width of the output',
    default: undefined,
  })
  maxWidth?: number;
}

@command({
  description: 'This is a command for visualising ElasticSearch search profile',
})
export default class extends Command {
  async execute(
    @param({
      description: 'JSON of the profile data',
      required: true,
      type: File,
    })
    profileFile: File,
    options: CommandOptions,
  ) {
    const maxWidth = options.maxWidth ?? process.stdout.columns;
    const parsedProfile = await profileFile.json();

    console.log(stringifyProfile(parsedProfile, { maxWidth, color: !options.noColor }));
  }
}
