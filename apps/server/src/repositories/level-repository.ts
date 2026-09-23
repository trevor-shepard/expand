import type {
  AdminLevel,
  LevelInput,
  LevelsListResponse,
} from "@expand/contracts";

export class RepositoryError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "CONFLICT" | "INVALID_REORDER",
    message: string,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export interface LevelRepository {
  listPublished(): Promise<LevelsListResponse>;
  listAdmin(): Promise<AdminLevel[]>;
  getById(id: string): Promise<AdminLevel>;
  create(input: LevelInput, actor: string): Promise<AdminLevel>;
  update(id: string, input: LevelInput, actor: string): Promise<AdminLevel>;
  publish(id: string, actor: string): Promise<AdminLevel>;
  unpublish(id: string, actor: string): Promise<AdminLevel>;
  archive(id: string, actor: string): Promise<AdminLevel>;
  reorder(levelIds: string[], actor: string): Promise<AdminLevel[]>;
}
