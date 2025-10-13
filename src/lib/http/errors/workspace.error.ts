export class WorkspaceError extends Error {
  constructor(message: string = 'Workspace error') {
    super(message);
    this.name = 'WorkspaceError';
    Object.setPrototypeOf(this, WorkspaceError.prototype);
  }
}

export class WorkspaceNotFoundError extends WorkspaceError {
  constructor(message: string = 'Workspace not found') {
    super(message);
  }
}

export class WorkspacePermissionError extends WorkspaceError {
  constructor(message: string = 'Permission denied') {
    super(message);
  }
}
