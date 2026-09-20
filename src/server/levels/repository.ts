import { legacyLevels } from '../../shared/legacy-levels';
import {
  playableLevelSchema,
  type PlayableLevel,
} from '../../shared/level-contract';

export interface LevelRepository {
  listPublished(): Promise<PlayableLevel[]>;
}

export class FixtureLevelRepository implements LevelRepository {
  async listPublished(): Promise<PlayableLevel[]> {
    return legacyLevels
      .map((level) => playableLevelSchema.parse(structuredClone(level)))
      .sort((left, right) => left.position - right.position);
  }
}
